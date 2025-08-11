# Front-End API Integration Documentation

## Overview

The `api.js` file in the front-end application abstracts the details of all RESTful API calls to the FastAPI backend. Each function in `api.js` corresponds to one or more endpoints in the backend (documented in `fast_api_app.py` and summarized in `fast_api_README.md`). This document explains the integration between the front-end functions and the corresponding back-end endpoints, and describes how streaming data (such as impression collection and click monitoring) is handled.

## Function-to-Endpoint Mapping

### 1. Authentication & Session Management

- **`signupUser(payload)`**  
  **Backend Endpoint:** `POST /api/signup`  
  Registers a new user by sending a payload containing username, password, and office code.

- **`loginUser(payload)`**  
  **Backend Endpoint:** `POST /api/login`  
  Authenticates a user. On successful login, the backend returns a session token which is stored locally.

- **`logoutUser(sessionToken)`**  
  **Backend Endpoint:** `POST /api/logout`  
  Terminates the session by sending the session token in the request header.

- **`fetchOffices()`**  
  **Backend Endpoint:** `GET /api/offices`  
  Retrieves a list of available offices for user registration or filtering.

- **`fetchUserNames()`**  
  **Backend Endpoint:** `GET /api/user_names`  
  Retrieves a list of user names filtered by office ID, using the session token.

### 2. Data Retrieval Endpoints

- **`fetchArticleTitles()`**  
  **Backend Endpoint:** `GET /api/article_titles`  
  Returns all unique article titles from the `urls_content` table.

- **`fetchTopics()`**  
  **Backend Endpoint:** `GET /api/topics`  
  Retrieves all distinct topics from the `unique_topics` table for filtering purposes.

- **`fetchArticles(query)`**  
  **Backend Endpoint:** `GET /api/articles`  
  Fetches articles with support for pagination and filtering (e.g., by topics or publication date). Query parameters are appended to the URL, and the backend returns the matching articles.

- **`fetchArticlesCount()`**  
  **Backend Endpoint:** `GET /api/articles/count`  
  Returns the total number of articles in the database.

- **`fetchPublicationDates()`**  
  **Backend Endpoint:** `GET /api/articles/dates`  
  Retrieves the unique publication dates from the articles.

- **`fetchFilteredArticles(sessionToken, payload)`**  
  **Backend Endpoint:** `POST /api/articles/filter`  
  Applies more complex filters (potentially using topics, dates, and article title substrings) and returns the filtered article list.

### 3. Recommendation & Interaction Endpoints

- **`fetchRecommendations(sessionToken, payload)`**  
  **Backend Endpoint:** `POST /api/recommendations`  
  Sends filter criteria (e.g., topics, date) and pagination parameters to get personalized article recommendations.  
  **Integration Note:**  
  This endpoint internally calls the MAB functions (as documented in `mab.md`) which rank articles based on aggregated click and impression data.

- **`fetchPulls(sessionToken)`**  
  **Backend Endpoint:** `GET /api/pulls`  
  Retrieves the history of article pulls (the recommendation cycles) for the current user.

- **`fetchUserArticleStats(sessionToken)`**  
  **Backend Endpoint:** `GET /api/user_article_stats`  
  Returns aggregated statistics (impressions, clicks, bookmarks, and adds) for the logged-in user.

- **`logInteraction(sessionToken, payload)`**  
  **Backend Endpoint:** `POST /api/interactions`  
  Logs user interactions such as clicks, bookmark actions, or adds by sending the interaction type and article ID.
  
  **Streaming Data Note (Click Monitoring):**  
  When a user clicks an article, this function immediately sends the event to the backend, updating the `user_article_stats` table and creating a record in the `user_interactions` table. This real-time data is then used to adjust recommendations dynamically.

### 4. Impression Collection

- **`logImpressions(sessionToken, articleIds)`**  
  **Backend Endpoint:** `POST /api/log_impressions`  
  Although not explicitly listed in every section of the backend documentation, impression logging is handled by a helper function (`log_impressions`) inside `fast_api_app.py`.  
  **Streaming Data Note (Impression Collection):**  
  As the user views a set of articles, the front-end invokes this function to record each impression. The backend ensures only one impression is recorded per pull and updates the `user_article_stats` accordingly. This continuous tracking helps the MAB algorithm recalculate UCB (upper confidence bound) values in near real-time.

### 5. Bookmark & Added Pages Management

- **Bookmark Functions:**  
  - **`fetchBookmarks(sessionToken)`** calls `GET /api/bookmarks`  
  - **`addBookmark(sessionToken, payload)`** calls `POST /api/add_bookmark`  
  - **`removeBookmark(sessionToken, url_id)`** calls `DELETE /api/bookmarks/{url_id}`  
  - **`fetchBookmarkCandidates(sessionToken)`** calls `GET /api/bookmarks_candidates`  
  - **`confirmBookmarkCandidate(sessionToken, payload)`** calls `POST /api/confirm_bookmark_candidate`  
  
  These functions help manage user bookmarks (and potential update candidates) through soft-deletion and confirmation of updated data.

- **Added Pages Functions:**  
  - **`addPage(sessionToken, payload)`** calls `POST /api/add_page`  
  - **`fetchAddedPages(sessionToken)`** calls `GET /api/added_pages`  
  - **`fetchAddedPagesDetails()`** calls `GET /api/added_pages/details`  
  - **`removeAddedPage(sessionToken, url_id)`** calls `DELETE /api/added_pages/{url_id}`  
  
  These endpoints allow users to add articles manually, retrieve detailed information about these pages, and remove them if necessary.

### 6. Template & Office Management

- **Template Management:**  
  Functions like **`fetchTemplates()`**, **`updateTemplate()`**, **`archiveTemplate()`**, **`deleteTemplate()`**, **`saveTemplate()`**, and **`fetchTemplateById()`** connect with endpoints in `fast_api_app.py` that manage content templates, including their creation, update, archiving, and history tracking.

- **Office Management:**  
  - **`fetchOfficeUsers(sessionToken)`** calls `GET /api/office_users`  
  - **`fetchOfficeUserInteractions(sessionToken)`** calls `GET /api/office_user_interactions`  
  
  These endpoints are used to retrieve user lists and office-wide interaction data, which can be valuable for monitoring overall engagement and performance.

## Real-Time & Streaming Considerations

While the front-end does not use a WebSocket or similar technology for true streaming, it employs the following strategies to handle real-time data:

- **Periodic Polling:**  
  Functions such as `fetchUserArticleStats`, `fetchOfficeUserInteractions`, and `fetchRecommendations` are periodically called to update the UI with the latest data. This creates an experience similar to streaming updates.

- **Immediate Data Logging:**  
  Functions like `logImpressions` and `logInteraction` are called immediately upon user actions. Even though these use standard HTTP requests, their quick execution ensures that the backend’s metrics are updated in close to real-time. This allows the MAB algorithm (detailed in `mab.md`) to adjust rankings based on the most recent user behaviors.

## Conclusion

The design of the `api.js` functions mirrors the RESTful structure of the FastAPI backend. Each call in the front-end is carefully mapped to a corresponding endpoint, ensuring that user actions—from authentication and article filtering to interaction logging and bookmark management—are seamlessly processed. The periodic polling for updates along with immediate logging of interactions creates a near real-time data flow that is critical for the dynamic recommendation system powered by the Hellinger-UCB algorithm.

This documentation should help developers understand how the front-end functions integrate with back-end endpoints and how the data flows during user interactions.

---