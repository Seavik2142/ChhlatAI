import os

os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://chhlat:chhlat@localhost:5434/chhlatai_test")
os.environ["JWT_SECRET"] = "test-secret-0123456789abcdef0123456789"
os.environ["ANTHROPIC_API_KEY"] = ""  # tests exercise the deterministic rule-based assistant
os.environ["UPLOAD_DIR"] = "/tmp/omnichat-test-uploads"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Plan, Role, User  # noqa: E402
from app.core.security import hash_password  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add_all([
            Plan(code="free", name="Free", price_monthly=0, ai_replies_limit=500, staff_seats=1, channels_limit=1),
            Plan(code="pro", name="Pro", price_monthly=29, ai_replies_limit=10000, staff_seats=5, channels_limit=4),
            User(email="admin@test.kh", password_hash=hash_password("Admin@12345"), full_name="Admin",
                 role=Role.super_admin),
        ])
        db.commit()
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_rate_limits():
    from app.core import rate_limit
    from app.core.redis import get_redis
    rate_limit._local.clear()
    r = get_redis()
    if r is not None:
        try:
            r.flushdb()
        except Exception:
            pass
    yield
    rate_limit._local.clear()
    if r is not None:
        try:
            r.flushdb()
        except Exception:
            pass


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
