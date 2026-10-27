import csv
import io

from fastapi import APIRouter, HTTPException, UploadFile
from sqlalchemy import select

from app.api.deps import DB, CurrentShop, Owner, ShopMember, get_in_shop
from app.integrations.storage import get_storage
from app.models import KnowledgeArticle, Product, QuickReply
from app.schemas import KnowledgeIn, KnowledgeOut, ProductIn, ProductOut, QuickReplyIn, QuickReplyOut

router = APIRouter(tags=["catalog"])


@router.post("/products/upload-image")
async def upload_product_image(file: UploadFile, shop: CurrentShop, _: Owner) -> dict:
    """Upload a product photo and return its accessible URL."""
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(415, f"Unsupported image format: {file.content_type}. Please upload JPG, PNG, or WebP.")
    data = await file.read(10 * 1024 * 1024 + 1)
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image file must be under 10 MB")
    ext = file.filename.rsplit(".", 1)[-1].lower()[:8] if file.filename and "." in file.filename else "jpg"
    url = get_storage().save(data, file.content_type, ext)
    return {"url": url}


@router.get("/products", response_model=list[ProductOut])
def list_products(shop: CurrentShop, _: ShopMember, db: DB, q: str | None = None):
    stmt = select(Product).where(Product.shop_id == shop.id)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    return db.scalars(stmt.order_by(Product.name)).all()


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(body: ProductIn, shop: CurrentShop, _: Owner, db: DB):
    product = Product(shop_id=shop.id, **body.model_dump())
    db.add(product)
    db.commit()
    return product


@router.put("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, body: ProductIn, shop: CurrentShop, _: Owner, db: DB):
    product = get_in_shop(db, Product, product_id, shop.id)
    for key, value in body.model_dump().items():
        setattr(product, key, value)
    db.commit()
    return product


@router.delete("/products/{product_id}", status_code=204)
def archive_product(product_id: int, shop: CurrentShop, _: Owner, db: DB) -> None:
    # Archive instead of delete so past invoices keep their product link.
    get_in_shop(db, Product, product_id, shop.id).is_active = False
    db.commit()


@router.post("/products/import")
async def import_products(file: UploadFile, shop: CurrentShop, _: Owner, db: DB) -> dict:
    """Import a price list exported from Excel as CSV: name, price, stock[, sku, category, description]."""
    raw = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(raw))
    if not reader.fieldnames or not {"name", "price"} <= {f.strip().lower() for f in reader.fieldnames}:
        raise HTTPException(400, "The CSV needs at least 'name' and 'price' columns")
    created = updated = 0
    for row in reader:
        row = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
        if not row.get("name"):
            continue
        try:
            price = float(row["price"].replace("$", ""))
            stock = int(row.get("stock") or 0)
        except ValueError:
            raise HTTPException(400, f"Invalid price or stock for '{row['name']}'") from None
        product = db.scalars(select(Product).where(Product.shop_id == shop.id, Product.name == row["name"])).first()
        if product is None:
            product = Product(shop_id=shop.id, name=row["name"], price=price)
            db.add(product)
            created += 1
        else:
            updated += 1
        product.price, product.stock, product.is_active = price, stock, True
        product.sku = row.get("sku") or product.sku
        product.category = row.get("category") or product.category
        product.description = row.get("description") or product.description
        product.about = row.get("about") or product.about or ""
        product.positive_impacts = row.get("positive_impacts") or row.get("benefits") or product.positive_impacts or ""
        product.negative_impacts = row.get("negative_impacts") or row.get("precautions") or row.get("side_effects") or product.negative_impacts or ""
        product.usage_instructions = row.get("usage_instructions") or row.get("how_to_use") or product.usage_instructions or ""
        product.image_url = row.get("image_url") or row.get("image") or product.image_url
    db.commit()
    return {"created": created, "updated": updated}


@router.get("/knowledge", response_model=list[KnowledgeOut])
def list_knowledge(shop: CurrentShop, _: ShopMember, db: DB):
    return db.scalars(select(KnowledgeArticle).where(KnowledgeArticle.shop_id == shop.id)
                      .order_by(KnowledgeArticle.id)).all()


@router.post("/knowledge", response_model=KnowledgeOut, status_code=201)
def create_knowledge(body: KnowledgeIn, shop: CurrentShop, _: Owner, db: DB):
    article = KnowledgeArticle(shop_id=shop.id, **body.model_dump())
    db.add(article)
    db.commit()
    return article


@router.put("/knowledge/{article_id}", response_model=KnowledgeOut)
def update_knowledge(article_id: int, body: KnowledgeIn, shop: CurrentShop, _: Owner, db: DB):
    article = get_in_shop(db, KnowledgeArticle, article_id, shop.id)
    article.title, article.content = body.title, body.content
    db.commit()
    return article


@router.delete("/knowledge/{article_id}", status_code=204)
def delete_knowledge(article_id: int, shop: CurrentShop, _: Owner, db: DB) -> None:
    db.delete(get_in_shop(db, KnowledgeArticle, article_id, shop.id))
    db.commit()


@router.get("/quick-replies", response_model=list[QuickReplyOut])
def list_quick_replies(shop: CurrentShop, _: ShopMember, db: DB):
    return db.scalars(select(QuickReply).where(QuickReply.shop_id == shop.id).order_by(QuickReply.command)).all()


@router.post("/quick-replies", response_model=QuickReplyOut, status_code=201)
def create_quick_reply(body: QuickReplyIn, shop: CurrentShop, _: Owner, db: DB):
    if db.scalar(select(QuickReply.id).where(QuickReply.shop_id == shop.id, QuickReply.command == body.command)):
        raise HTTPException(409, f"{body.command} already exists")
    qr = QuickReply(shop_id=shop.id, **body.model_dump())
    db.add(qr)
    db.commit()
    return qr


@router.delete("/quick-replies/{reply_id}", status_code=204)
def delete_quick_reply(reply_id: int, shop: CurrentShop, _: Owner, db: DB) -> None:
    db.delete(get_in_shop(db, QuickReply, reply_id, shop.id))
    db.commit()
