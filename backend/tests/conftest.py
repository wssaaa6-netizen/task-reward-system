"""Backend test configuration and fixtures"""
import pytest
import httpx
from app.main import app, initialize_admin_account
from app.database.mongodb import connect_to_mongo, close_mongo_connection

@pytest.fixture(autouse=True)
async def db_lifecycle():
    await connect_to_mongo()
    await initialize_admin_account()
    yield
    await close_mongo_connection()

@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
