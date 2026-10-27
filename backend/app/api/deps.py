from typing import Annotated, TypeVar

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Role, Shop, ShopStatus, User
from app.core.security import decode_access_token

bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DB, creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> User:
    user_id = decode_access_token(creds.credentials) if creds else None
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role):
    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this area")
        return user

    return checker


SuperAdmin = Annotated[User, Depends(require_roles(Role.super_admin))]
Owner = Annotated[User, Depends(require_roles(Role.owner))]
ShopMember = Annotated[User, Depends(require_roles(Role.owner, Role.staff))]


def get_current_shop(user: ShopMember, db: DB) -> Shop:
    shop = db.get(Shop, user.shop_id)
    if shop is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Shop not found")
    if shop.status == ShopStatus.suspended:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This shop is suspended — contact OmniChat support")
    return shop


CurrentShop = Annotated[Shop, Depends(get_current_shop)]

T = TypeVar("T")


def get_in_shop(db: Session, model: type[T], obj_id: int, shop_id: int) -> T:
    """Fetch a row by id, 404 unless it belongs to the caller's shop (tenant isolation)."""
    obj = db.get(model, obj_id)
    if obj is None or getattr(obj, "shop_id", None) != shop_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"{model.__name__} not found")
    return obj
