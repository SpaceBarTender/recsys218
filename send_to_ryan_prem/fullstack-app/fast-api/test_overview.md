# Testing Overview and Documentation

This document provides complete documentation for the testing-related files in the FastAPI backend:
- `conftest.py`
- `test_api.py`

These files form the backbone of the automated test suite using pytest and help ensure that the API endpoints work as expected.

---

## 1. conftest.py

### Purpose
`conftest.py` is used to define shared test fixtures that can be automatically discovered by pytest. It ensures that common test resources – such as the FastAPI test client, a mocked database connection, and sample user data – are available to all test modules without needing to redefine them in every file.

### Fixtures

#### a) `client`
- **Scope:** Module (to optimize app startup cost)
- **Description:**  
  Creates an instance of FastAPI's `TestClient` for testing API endpoints. The client uses the FastAPI `app` imported from `fast_api_app.py` and is yielded within a context manager to ensure proper cleanup after tests complete.
  
- **Code Example:**
  ```python
  @pytest.fixture(scope="module")  # scope="module" is efficient if app setup is costly
  def client():
      """Create a test client using FastAPI's TestClient"""
      with TestClient(app) as test_client:
          yield test_client
  ```

#### b) `mock_db_connection`
- **Description:**  
  Provides a mocked database connection using Python's `unittest.mock.MagicMock`. This mock simulates the behavior of a real database connection so that tests can verify database-related logic without requiring an actual database.
  
- **Implementation Details:**
  - Creates a mock connection and a mock cursor.
  - Configures the cursor to work as a context manager.
  - Mocks common cursor methods such as `execute`, `fetchone`, and `fetchall`.

- **Code Example:**
  ```python
  @pytest.fixture
  def mock_db_connection():
      """Mock database connection for testing"""
      mock_conn = MagicMock()
      mock_cursor = MagicMock()
      # Configure the context manager behavior
      mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
      # Make fetchone/fetchall directly available on the cursor
      mock_cursor.fetchone = MagicMock()
      mock_cursor.fetchall = MagicMock()
      mock_cursor.execute = MagicMock()
      return mock_conn
  ```

#### c) `mock_user_data`
- **Description:**  
  Returns a sample dictionary containing user information that simulates the required payload for testing user authentication and signup endpoints.

- **Code Example:**
  ```python
  @pytest.fixture
  def mock_user_data():
      """Sample user data for testing"""
      return {
          "username": "testuser",
          "password": "testpass123",
          "office_code": "TEST01"  # Ensure this matches expected format/case
      }
  ```

### Summary
- **Overall Role:**  
  These fixtures isolate tests from production dependencies. The `client` fixture allows sending HTTP requests to the FastAPI app, while `mock_db_connection` prevents tests from hitting a real database. The `mock_user_data` provides a consistent source of user data necessary for authentication endpoints.
  
---

## 2. test_api.py

### Purpose
`test_api.py` is the main file containing the tests for the FastAPI application's endpoints. It validates the correct behavior of various functionalities including authentication, article management, user interactions, template operations, and more.

### Structure and Test Coverage

#### a) Authentication Tests
- **Endpoints Covered:** `/api/signup`, `/api/login`, `/api/logout`
- **Example Test Cases:**
  - `test_signup_success`: Tests that a user can sign up successfully.
  - `test_signup_invalid_office`: Verifies that the API rejects signup attempts with an invalid office code.
  - `test_login_success`: Checks that valid credentials produce a session token.
  - `test_login_invalid_credentials`: Ensures that an invalid password (or missing user) results in an authentication error.
  
- **Usage:**  
  These tests use the `mock_db_connection` and `mock_user_data` fixtures to simulate database responses and user input.

#### b) Article Management Tests
- **Endpoints Covered:** `/api/articles`, `/api/articles/count`, `/api/article_titles`, `/api/user_names`
- **Example Test Cases:**
  - `test_get_articles`: Ensures the API correctly returns a list of articles with filtering.
  - `test_get_articles_count`: Validates that the total article count is correctly fetched.
  - `test_get_offices`: Confirms that the API can list available offices.

#### c) Interaction Tests
- **Endpoint Covered:** `/api/interactions`
- **Example Test Cases:**
  - `test_log_interaction`: Tests that interactions (like clicks) are logged, and the server-side constraint for duplicate clicks is enforced.
  - Additional tests simulate database errors (e.g. `psycopg2.Error`) and general exceptions during interaction logging.

#### d) Template & Bookmark Tests
- **Template Endpoints:**
  - Endpoints such as `/api/templates`, `/api/templates/{template_id}`, and `/api/templates/{template_id}/archive` are tested.
  - Tests validate both successful operations (creation, retrieval, update, archiving) and error cases (missing fields, non-existent resources).
  
- **Bookmark Endpoints:**
  - Endpoints tested include `/api/bookmarks`, `/api/add_bookmark`, `/api/confirm_bookmark_candidate`, and removal endpoints.
  - Tests check the correct logging of bookmark interactions and the appropriate handling when bookmark updates are attempted.

#### e) Additional Endpoint Tests
- **Other endpoints:**  
  Tests cover various endpoints including:
  - Added pages (`/api/add_page`, `/api/added_pages`)
  - Office-related information (`/api/office_mab_stats`, `/api/office_users`, `/api/office_user_interactions`)
  - Pulls (`/api/pulls`)

- **Focus Areas:**
  - Tests ensure proper HTTP status codes are returned for both successful operations and errors.
  - They simulate real-world scenarios, including unauthorized access, invalid session tokens, and simulated database connection issues.

### Fixtures and Mocks in test_api.py

- **`client` Fixture:**  
  Used to send HTTP requests to the FastAPI app. This is the same client created in `conftest.py`.
  
- **`mock_db_connection` Fixture:**  
  Passed to tests that require simulating database behavior. The tests patch the `connect_db` function to return this mock.
  
- **`mock_user_data` Fixture:**  
  Provides consistent user credentials for testing authentication flows.
  
- **Additional Fixtures:**  
  - `mock_session_token`: Generates a fake session token for simulating authenticated requests.
  - `mock_article_data`: Supplies sample article information for endpoints dealing with articles.

### Example Test from test_api.py
Below is an excerpt of a test that verifies successful login:
```python
def test_login_success(client, mock_db_connection, mock_user_data, mock_session_token):
    """Test successful login."""
    with patch('fast_api_app.connect_db', return_value=mock_db_connection), \
         patch('fast_api_app.checkpw', return_value=True):
        mock_db_connection.cursor.return_value.__enter__.return_value.fetchone.side_effect = [
            (1, "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY.HHKbr2rES.fK"),
            None
        ]
        response = client.post('/api/login', json={
            "username": mock_user_data["username"],
            "password": mock_user_data["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["message"] == "Login successful"
```

### Error Handling in Tests
`test_api.py` includes tests that deliberately simulate errors:
- Database errors are triggered to verify that the API rolls back transactions and returns a proper HTTP 500 error.
- Invalid session tokens and missing required fields are tested to ensure the API correctly returns HTTP 401 or 400 errors.

### Overall Role
`test_api.py` represents a comprehensive suite of tests designed to cover all critical API endpoints. It is essential for ensuring that any changes to the application code do not inadvertently break functionality. The extensive use of fixtures and mocks helps in isolating tests from external systems and produces reliable, repeatable test results.

---

## Conclusion

Together, `conftest.py` and `test_api.py` provide a robust automated testing framework for the FastAPI backend. The fixtures defined in `conftest.py` supply the foundational building blocks (such as the test client and mocked database connections), and the tests in `test_api.py` validate the integrity and reliability of the API endpoints under various conditions. This integrated setup is crucial for continuous integration and for maintaining high quality as the application evolves.

## Running Tests

To run the entire test suite from the project root, use:
```bash
pytest -v
```
This command will discover all tests defined in `conftest.py` and `test_api.py` and run them in verbose mode.

For a quicker summary with only the first failure and no warnings, you can use:
```bash
pytest --maxfail=1 --disable-warnings -q
```

To run tests for a specific file (for example, `test_api.py`), use:
```bash
pytest fast-api/test_api.py -v
```
