"""
LAPHIS — Test Configuration & Fixtures
SQLite in-memory DB, TestClient, helpers for auth & profile creation.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Force test DB BEFORE any app imports
os.environ["DATABASE_URL"] = "sqlite:///./test_laphis.db"
os.environ["SECRET_KEY"] = "test-secret-key"

from src.core.db import Base, get_db
from src.main import app

# ── Test DB engine (file-based SQLite for reliability) ──
TEST_DATABASE_URL = "sqlite:///./test_laphis.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    # Clean up test db file
    import pathlib
    db_file = pathlib.Path("./test_laphis.db")
    if db_file.exists():
        db_file.unlink()


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables between tests for isolation."""
    yield
    db = TestSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


@pytest.fixture
def client():
    """FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def db_session():
    """Raw DB session for direct manipulation."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Helper: register + get token ──
@pytest.fixture
def auth_token(client):
    """Register a test user, return (token, user_id)."""
    resp = client.post("/auth/register", json={
        "email": "test@laphis.com",
        "password": "TestPass123!",
        "goal": "manter",
    })
    data = resp.json()
    return data["access_token"], data["id"]


@pytest.fixture
def auth_with_profile(client, auth_token):
    """Register user + create profile, return (token, user_id, profile_id)."""
    token, user_id = auth_token
    resp = client.post(f"/profile?token={token}", json={
        "name": "Test User",
        "age": 25,
        "sex": "masculino",
        "height_cm": 175,
        "weight_kg": 75.0,
        "goal": "manter",
        "level": "intermedio",
        "days_per_week": 4,
    })
    assert resp.status_code == 200, f"Profile creation failed: {resp.json()}"
    profile = resp.json()
    return token, user_id, profile["id"]
