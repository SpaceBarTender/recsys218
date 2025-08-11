import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path
from unittest.mock import MagicMock
from fastapi import FastAPI, APIRouter

# Add the parent directory to Python path
# This allows importing fast_api_app from the sibling directory
sys.path.append(str(Path(__file__).parent.parent))

# Import app here to make it available for the client fixture
from fast_api_app import app

@pytest.fixture(scope="module") # scope="module" can be efficient if app setup is costly
def client():
    """Create a test client using FastAPI's TestClient"""
    # Use the imported app object
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def mock_db_connection():
    """Mock database connection for testing"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    # Configure the context manager behavior
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    # Make fetchone/fetchall directly available on the cursor mock if needed
    mock_cursor.fetchone = MagicMock()
    mock_cursor.fetchall = MagicMock()
    mock_cursor.execute = MagicMock()
    return mock_conn

@pytest.fixture
def mock_user_data():
    """Sample user data for testing"""
    return {
        "username": "testuser",
        "password": "testpass123",
        "office_code": "TEST01" # Ensure this matches expected format/case
    }
