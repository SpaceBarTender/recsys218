# FastAPI Backend Documentation

## Overview
The FastAPI backend serves as the core of the article recommendation system. It implements a Multi-Armed Bandit (MAB) algorithm for personalized content delivery and provides RESTful API endpoints for user authentication, article management, and interaction tracking.

## Table of Contents
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Environment Configuration](#environment-configuration)
- [Helper Functions](#helper-functions)
- [Database Operations](#database-operations)
- [Error Handling & Security Considerations](#error-handling--security-considerations)
- [Database Schema](#database-schema)
- [Core Components](#core-components)
- [MAB Implementation](#mab-implementation)
- [Authentication System](#authentication-system)
- [Development Setup](#development-setup)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Performance Considerations](#performance-considerations)
- [Contributing](#contributing)

## Project Structure

fast-api/
├── fast_api_app.py # Main FastAPI application
├── db_utils.py # Database connection utilities
├── mab.py # Multi-Armed Bandit implementation
├── requirements.txt # Python dependencies
├── Dockerfile # Container configuration
├── test_api.py # API tests
├── conftest.py # Test configuration
└── schema_update.sql # Database schema updates


## Dependencies
Listed in `requirements.txt`:
```txt
fastapi
uvicorn
psycopg2-binary
bcrypt
python-multipart
python-jose[cryptography]
```

## Environment Configuration

### Environment Variables
- `LOG_MAB_RANKS`: Enable/disable MAB ranking logging (default: "false")
- `DATABASE_URL`: PostgreSQL connection string
- `MAB_RANK_LOG_ENABLED`: Enable/disable MAB logging

### Constants
- `C_PARAM`: Exploration parameter for MAB algorithm (default: 2.0)
- `COLD_THRESHOLD`: Threshold for cold start articles (default: 5)

### CORS Configuration
```python
origins = [
    "http://localhost:5173",
    "https://recsys218.usgovvirginia.cloudapp.usgovcloudapi.net"
]
```

## Helper Functions

### Token Generation
```python
def generate_token():
    """Generates a unique session token using UUID."""
    return str(uuid.uuid4())
```

### Impression Logging
```python
def log_impressions(conn, user_id, article_ids, session_id, pull_ids, office_id):
    """
    Logs user impressions for the current ranking cycle.
    - Ensures one impression per pull_id is logged.
    - Updates user_article_stats.pull_impressions.
    """
```

### Article Fetching
```python
def fetch_articles(conn, topics=None, date_min=None, articles=None, offset=0, limit=10):
    """
    Fetches articles with optional filtering.
    Supports filtering by:
      - Topics (array overlap and ILIKE)
      - Publication date
      - Article titles (ILIKE)
    """
```

## Impression Logging and CTR Calculation

The `log_impressions` function is invoked every time a user views a set of articles. It guarantees that only one impression per pull (i.e., a discrete recommendation cycle) is recorded, and it updates the `pull_impressions` field in the `user_article_stats` table.

**Click-Through Rate (CTR) Calculation for the MAB:**

- **CTR Definition:**  

  For each article, the CTR is calculated as the ratio of the total recorded clicks (`S`) to the total number of recorded impressions (`N`):
  
  \[
  \text{CTR} = \frac{S}{N} \quad (\text{for } N > 0)
  \]

  If \(N = 0\) in any one article, the system defaults to a maximum exploration value, ensuring that new or 
  under-explored articles still have an opportunity to be selected.


  **Important Note:**  
  In each round of impressions (a single pull), **only one click is recorded per article—even if a user clicks multiple times**. This constraint is in place because allowing multiple clicks per round can lead to inflated or erratic CTR values, which may cause mathematical errors in the backend and disrupt the stability of the MAB algorithm.

- **Usage in the MAB Algorithm:**  
  The empirical success probability, \(p_{\text{hat}} = \frac{S}{N}\), is fed into the functions in `mab.py` (specifically into `get_hellinger_ucb` and `rank_articles_hellinger_ucb`). These functions calculate the upper confidence bound (UCB) for each article based on:
    - The CTR as measured by \(p_{\text{hat}}\).
    - An exploration factor controlled by the constant `C_PARAM`.
    - A threshold (`COLD_THRESHOLD`) ensuring proper handling of articles with very few impressions.

- **Dynamic Recommendation Updates:**  
  This continuous tracking of impressions (via `log_impressions`) and controlled recording of clicks allows the MAB algorithm to recalculate UCB values nearly in real-time. Articles with increasing CTRs receive higher rankings, while those with low engagement trigger more exploration, thereby maintaining the model's stability and efficient balance between exploration and exploitation.

For further details on the UCB calculation and the overall MAB process, please see the [MAB Implementation Documentation](./mab.md).

## Database Operations

### Connection & Transaction Management
- Uses connection pooling and parameterized queries.
- Implements commit/rollback for atomic operations.
- Ensures connections are closed in finally blocks.
- Employs efficient joins and proper indexing for performance.

## Error Handling & Security Considerations

### Error Handling Patterns
```python
try:
    # Database operations
except psycopg2.Error as e:
    conn.rollback()
    raise HTTPException(status_code=500, detail=str(e))
finally:
    conn.close()
```
- **Validation Errors:** Checks for required inputs and raises HTTP 400.
- **Authentication Errors:** Validates session tokens and raises HTTP 401 when invalid or expired.

### Security Considerations
- **Input Validation:** All inputs are validated and sanitized.
- **Session Management:** Uses token-based authentication with session expiration.
- **Data Protection:** Uses parameterized queries to prevent SQL injection.
- **CORS & API Security:** Configured CORS, rate limiting, and proper error handling.

## Database Schema

### Core Tables
- **`users`**  
  - Primary key: user_id  
  - Fields: username, password_hash, office_id, created_at  
  - Purpose: Stores user credentials and office association.

- **`sessions`**  
  - Primary key: session_id  
  - Fields: user_id, session_token, expires_at  
  - Purpose: Manages active user sessions.

- **`offices`**  
  - Primary key: office_id  
  - Fields: office_code  
  - Purpose: Organizational unit definitions.

- **`urls_content`**  
  - Primary key: url_id  
  - Fields: title, publication_date, topics, topics_array, description, author, url  
  - Purpose: Article content and metadata.

### Interaction Tracking Tables
- **`user_interactions`**  
  - Primary key: interaction_id  
  - Fields: user_id, url_id, pull_id, interaction_type, interaction_time  
  - Purpose: Logs all user interactions (clicks, bookmarks, adds).

- **`impressions`**  
  - Primary key: impression_id  
  - Fields: user_id, url_id, session_id, pull_id, office_id, impression_time  
  - Purpose: Tracks article views and impressions.

- **`pulls`**  
  - Primary key: pull_id  
  - Fields: user_id, url_id, office_id, filter_topics, filter_date, page_offset, created_at  
  - Purpose: Records when articles are pulled for recommendations.

### Statistics and Analytics Tables
- **`user_article_stats`**  
  - Primary key: composite (office_id, user_id, url_id, pull_id)  
  - Fields: pull_impressions, pull_clicks, pull_bookmarks, pull_adds, last_interaction  
  - Purpose: Aggregates user engagement metrics.

- **`mab_rank_logs`**  
  - Primary key: mab_rank_log_id  
  - Fields: office_id, user_id, session_id, url_id, rank_position, impressions_count, clicks_count, ucb_value, time_index_t, c_param, cold_threshold, filter_topics, filter_date  
  - Purpose: Logs MAB ranking decisions and parameters.

### Content Organization Tables
- **`bookmarks`**  
  - Primary key: composite (user_id, url_id)  
  - Fields: bookmarked_at, removed_at, journal_series_id  
  - Purpose: Manages user bookmarks.

- **`bookmarks_candidate`**  
  - Primary key: candidate_id  
  - Fields: user_id, original_url_id, candidate_url_id, similarity  
  - Purpose: Tracks potential updates to bookmarked articles.

- **`added_pages`**  
  - Primary key: composite (user_id, url_id)  
  - Fields: added_at, removed_at  
  - Purpose: Manages user-added content.

### Template Management Tables
- **`templates`**  
  - Primary key: template_id  
  - Fields: name, description, created_by, created_at, updated_at, is_archived, archived_at, archived_by  
  - Purpose: Stores template definitions.

- **`template_sections`**  
  - Primary key: section_id  
  - Fields: template_id, parent_section_id, section_order, section_title, article_title, command  
  - Purpose: Defines the hierarchical structure of templates.

- **`template_history`**  
  - Primary key: history_id  
  - Fields: template_id, modified_by, change_type, change_description, created_at  
  - Purpose: Tracks template modifications.

### Supporting Tables
- **`unique_topics`**  
  - Primary key: topic_id  
  - Fields: topic  
  - Purpose: Maintains a unique list of article topics.

### Table Relationships
- `users` → `sessions`: One-to-many
- `users` → `offices`: Many-to-one
- `users` → `user_interactions`, `bookmarks`, `added_pages`: One-to-many
- `templates` → `template_sections`, `template_history`: One-to-many
- `urls_content` → `bookmarks`, `added_pages`, `user_interactions`: One-to-many

## Core Components

### 1. FastAPI Application (`fast_api_app.py`)
The main application file containing all API endpoints and business logic. Key features include:
- CORS middleware configuration
- Session token generation (via `generate_token()`)
- Error handling and input validation

### 2. Database Utilities (`db_utils.py`)
Handles database connections and provides connection pooling with proper transaction management.

### 3. MAB Implementation (`mab.py`)
Implements the Multi-Armed Bandit algorithm for article ranking.
```python
def rank_articles_hellinger_ucb(article_ids, stats_dict, t, c=2.0):
    """Ranks articles using Hellinger UCB algorithm."""
    # Implementation details...
```

## MAB Implementation

### Algorithm Details
- Uses Hellinger UCB for article ranking.
- Key parameters:
  - `C_PARAM`: Exploration parameter (default: 2.0)
  - `COLD_THRESHOLD`: Cold start threshold (default: 5)

### Ranking Process
1. Gather article statistics.
2. Calculate UCB values.
3. Rank articles based on UCB scores.
4. Log ranking data for analysis.

## Authentication System

### Session Management
- Token-based authentication.
- Handles session creation, token validation, and expiration.
- Office-based access control.

### Security Features
- Password hashing with bcrypt.
- Input validation and CORS protection.

## Development Setup

### Local Development
1. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
2. Configure environment variables:
    ```bash
    export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
    ```
3. Run the application:
    ```bash
    uvicorn fast_api_app:app --reload
    ```

### Docker Setup
1. Build the image:
    ```bash
    docker build -t fast-api .
    ```
2. Run the container:
    ```bash
    docker run -p 8000:8000 fast-api
    ```

## Testing

### Test Structure
- `test_api.py`: API endpoint tests.
- `conftest.py`: Test fixtures and configuration.

### Running Tests
```bash
pytest test_api.py -v
```

## Deployment

### Production Considerations
- Database connection pooling.
- Error logging and performance monitoring.
- Security hardening.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string.
- `MAB_RANK_LOG_ENABLED`: Enable/disable MAB logging.

### Monitoring
- API response times.
- Database performance.
- Error rates.
- User engagement metrics.

## API Endpoints

### Authentication System
- `POST /api/signup`: User registration.
- `POST /api/login`: User authentication.
- `POST /api/logout`: Session termination.
- `GET /api/offices`: List available offices.
- `GET /api/user_names`: Get office user names.

### Article Management
- `GET /api/articles`: Fetch articles with pagination.
- `GET /api/articles/count`: Get total article count.
- `GET /api/articles/dates`: Get unique publication dates.
- `POST /api/articles/filter`: Filter articles by topics, dates, titles, etc.

### Recommendation System
- `POST /api/recommendations`: Get personalized recommendations.
- `GET /api/pulls`: Get user's article pulls.
- `GET /api/mab_rank_logs`: Get MAB ranking data.

### Bookmark Management
- `GET /api/bookmarks`: Get user bookmarks.
- `POST /api/add_bookmark`: Add bookmark.
- `DELETE /api/bookmarks/{url_id}`: Remove bookmark.
- `GET /api/bookmarks_candidates`: Get bookmark update candidates.
- `POST /api/confirm_bookmark_candidate`: Confirm bookmark update.

### User Interaction Tracking
- `POST /api/interactions`: Log user interactions.
- `GET /api/user_article_stats`: Retrieve user statistics.
- `GET /api/office_user_interactions`: Get office-wide interactions.
- `GET /api/office_mab_stats`: Get office MAB statistics.

### Template Management
- `POST /api/templates`: Create a new template.
- `GET /api/templates`: List templates with pagination.
- `GET /api/templates/{template_id}`: Get template details.
- `PUT /api/templates/{template_id}`: Update template.
- `PATCH /api/templates/{template_id}/archive`: Archive/unarchive template.

### Added Pages Management
- `POST /api/add_page`: Add a new page.
- `GET /api/added_pages`: Get user's added pages.
- `GET /api/added_pages/details`: Get detailed added pages information.
- `DELETE /api/added_pages/{url_id}`: Remove an added page.

## Data Models

### User Model
```python
User:
    user_id: UUID
    username: str
    password_hash: str
    office_id: UUID
    created_at: datetime
```

### Article Model
```python
Article:
    url_id: int
    title: str
    publication_date: datetime
    topics: List[str]
    author: str
    description: str
    url: str
```

### Interaction Model
```python
Interaction:
    interaction_id: UUID
    user_id: UUID
    url_id: int
    interaction_type: str
    interaction_time: datetime
    pull_id: UUID
```

## Performance Considerations

### Database Optimization
- Connection pooling.
- Indexed queries.
- Efficient joins and query optimization.

### Caching Strategy
- Caching for sessions, article metadata, statistics, and templates.

### Rate Limiting
- API request limits.
- User-based and office-based throttling.

## Contributing

### Code Style
- Follow PEP 8 guidelines.
- Use type hints.
- Document all functions.
- Write unit tests.