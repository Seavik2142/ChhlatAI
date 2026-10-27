from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    catalog,
    conversations,
    knowledge,
    marketing,
    orders,
    shop,
    webhooks,
    ws,
)

api_router = APIRouter()
for module in (auth, shop, catalog, knowledge, conversations, orders, marketing, admin, webhooks):
    api_router.include_router(module.router)
api_router.include_router(admin.public)
api_router.include_router(ws.router)

