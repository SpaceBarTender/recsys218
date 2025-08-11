import math
import pickle
import psycopg2
from fastapi import FastAPI, HTTPException, Query, Body, Header, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from bcrypt import hashpw, gensalt, checkpw
import uuid
from datetime import datetime, timedelta
from mab import rank_articles_hellinger_ucb
import traceback
from db_utils import connect_db
import json
import os
import subprocess
from fuzzywuzzy import fuzz
from typing import List, Optional




# Initialize the FastAPI app
app = FastAPI()

# Enable CORS
origins = [
    "http://localhost:5173",
    "https://recsys218.usgovvirginia.cloudapp.usgovcloudapi.net"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enable/Disable Bandit Probability and Rank logging for real-time behavior analytics (Leave "false" until testing or monitoring real time model behavior for a short time (5 min))
LOG_MAB_RANKS = os.environ.get("MAB_RANK_LOG_ENABLED", "false").lower() == "true"

# You might also define your MAB constants:
C_PARAM = .26 # RANGE BETWEEN 0.25 and 0.5 (0.25 is more exploitative, 0.5 is more explorative)
# COLD_THRESHOLD = 1

def generate_token():
    """Generates a unique session token using UUID."""
    return str(uuid.uuid4())

# ------------------------------------------------------------------
# Signup / Login / Topics Endpoints
# ------------------------------------------------------------------

@app.get("/api/offices")
def get_offices():
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT office_id, office_code FROM offices;")
            offices = cur.fetchall()
            return [{"office_id": row[0], "office_code": row[1]} for row in offices]
    except psycopg2.Error as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch offices: {e}")
    finally:
        conn.close()


@app.post("/api/signup", status_code=201)
def signup(payload: dict = Body(...)):
    username = payload.get("username")
    password = payload.get("password")
    office_code = payload.get("office_code")
    if not username or not password or not office_code:
        raise HTTPException(status_code=400, detail="Username, password, and office code are required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT office_id FROM offices WHERE office_code = %s;", (office_code,))
            office = cur.fetchone()
            if not office:
                raise HTTPException(status_code=400, detail="Invalid office code")
            office_id = office[0]
            hashed_password = hashpw(password.encode('utf-8'), gensalt())
            cur.execute(
                """
                INSERT INTO users (username, password_hash, office_id) 
                VALUES (%s, %s, %s);
                """,
                (username, hashed_password.decode('utf-8'), office_id)
            )
            conn.commit()
        return {"message": "User created successfully"}
    except psycopg2.Error as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {e}")
    finally:
        conn.close()

@app.post("/api/login")
def login(payload: dict = Body(...)):
    username = payload.get("username")
    password = payload.get("password")
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, password_hash FROM users WHERE username = %s;", (username,))
            result = cur.fetchone()
            if not result:
                raise HTTPException(status_code=401, detail="Invalid username or password")
            user_id, stored_hash = result
            if not checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
                raise HTTPException(status_code=401, detail="Invalid username or password")
            session_token = generate_token()
            expires_at = datetime.now() + timedelta(hours=1)
            try:
                cur.execute(
                    "INSERT INTO sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s);",
                    (user_id, session_token, expires_at)
                )
                conn.commit()
                print(f"[DEBUG] Session created for user_id: {user_id}, token: {session_token}")
            except psycopg2.Error as e:
                print(f"[ERROR] Failed to insert session: {e}")
                raise HTTPException(status_code=500, detail="Failed to create session")
        return {"message": "Login successful", "session_token": session_token}
    except psycopg2.Error as e:
        print(f"[ERROR] Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    finally:
        conn.close()

@app.post("/api/logout")
def logout(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE sessions SET expires_at = NOW() WHERE session_token = %s", 
                (authorization,)
            )
        conn.commit()
        return {"message": "Logged out successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Failed to log out")
    finally:
        conn.close()




@app.get("/api/topics")
def get_topics():
    query = "SELECT DISTINCT topic FROM unique_topics ORDER BY topic ASC;"
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            topics = cur.fetchall()
            topic_list = [topic[0] for topic in topics if topic[0]]
        return {"topics": topic_list}
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to retrieve topics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve topics")
    finally:
        conn.close()

@app.get("/api/article_titles")
def get_article_titles():
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT title FROM urls_content;")
            rows = cur.fetchall()
            titles = [row[0] for row in rows if row[0]]
        return {"titles": titles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/user_names")
def get_user_names(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.office_id 
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_token = %s AND s.expires_at > NOW();
            """, (authorization,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            office_id = row[0]

            cur.execute("""
                SELECT DISTINCT username 
                FROM users
                WHERE office_id = %s;
            """, (office_id,))
            rows = cur.fetchall()
            userNames = [row[0] for row in rows if row[0]]
        return {"userNames": userNames}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

def log_impressions(conn, user_id, article_ids, session_id, pull_ids, office_id):
    """
    Log user impressions for the current ranking cycle.
    - Ensures **one impression per pull_id** is logged.
    - Updates `user_article_stats.pull_impressions` for each article.
    """
    try:
        with conn.cursor() as cur:
            # 1️⃣ Insert impressions, ensuring one per (user, pull_id)
            insert_query = """
                INSERT INTO impressions (user_id, url_id, session_id, pull_id, office_id, impression_time)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (user_id, url_id, session_id, pull_id) DO NOTHING;
            """
            impressions_data = [
                (user_id, article_id, session_id, pull_id, office_id)
                for article_id, pull_id in zip(article_ids, pull_ids)
            ]
            cur.executemany(insert_query, impressions_data)

            # 2️ Increment `pull_impressions` in `user_article_stats`
            update_query = """
                UPDATE user_article_stats
                SET pull_impressions = pull_impressions + 1
                WHERE office_id = %s AND user_id = %s AND url_id = %s AND pull_id = %s;
            """
            update_data = [
                (office_id, user_id, article_id, pull_id)
                for article_id, pull_id in zip(article_ids, pull_ids)
            ]
            cur.executemany(update_query, update_data)

            conn.commit()

    except Exception as e:
        print(f"[ERROR] Failed to log impressions: {e}")
        conn.rollback()


def fetch_articles(conn, topics=None, date_min=None, articles=None, offset=0, limit=10):
    print(f"[DEBUG] Fetching articles with filters - topics: {topics}, date_min: {date_min}, articles: {articles}")
    
    query = """
        SELECT uc.*
        FROM urls_content uc
        WHERE 1=1
    """
    params = []
    
    if topics and len(topics) > 0:
        # Use array overlap operator (&&) for topics_array and ILIKE for topics text field
        topic_conditions = []
        for topic in topics:
            topic_conditions.append("uc.topics_array && ARRAY[%s]::text[]")
            topic_conditions.append("uc.topics ILIKE %s")
            params.extend([topic, f"%{topic}%"])
        query += " AND (" + " OR ".join(topic_conditions) + ")"
        print(f"[DEBUG] Topic conditions: checking both topics_array and topics field")
    
    if date_min:
        # Convert date_min to timestamp if it's not already
        try:
            if isinstance(date_min, str):
                date_min = datetime.strptime(date_min, '%Y-%m-%d')
            query += " AND uc.publication_date >= %s"
            params.append(date_min)
            print(f"[DEBUG] Date filter: {date_min}")
        except Exception as e:
            print(f"[WARNING] Invalid date format: {date_min}, skipping date filter")
    
    if articles and len(articles) > 0:
        # Use ILIKE for case-insensitive title matching
        title_conditions = []
        for article in articles:
            title_conditions.append("uc.title ILIKE %s")
            params.append(f"%{article}%")
        query += " AND (" + " OR ".join(title_conditions) + ")"
        print(f"[DEBUG] Title conditions: {title_conditions}")
    
    query += " ORDER BY uc.publication_date DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    print(f"[DEBUG] Final query: {query}")
    print(f"[DEBUG] Query params: {params}")
    
    try:
        with conn.cursor() as cur:
            cur.execute(query, params)
            # Get column names from cursor description
            columns = [desc[0] for desc in cur.description]
            # Convert each row tuple to a dictionary with column names as keys
            results = [dict(zip(columns, row)) for row in cur.fetchall()]
            print(f"[DEBUG] Found {len(results)} articles")
            return results
    except Exception as e:
        print(f"[ERROR] Database error in fetch_articles: {str(e)}")
        print(f"[ERROR] Query that failed: {query}")
        print(f"[ERROR] Parameters used: {params}")
        raise e



@app.get("/api/articles")
def get_articles(
    offset: int = 0,
    limit: int = 20,
    topics: List[str] = Query([]),
    date_min: Optional[str] = None
):
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        articles = fetch_articles(conn, topics, date_min, offset=offset, limit=limit)
        return {"articles": articles}
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/api/recommendations")
def get_recommendations(data: dict = Body(...), authorization: str = Header(None, alias="Authorization")):
    print(f"[DEBUG] /recommendations => Received request payload: {data} (type: {type(data)})")
    
    session_token = authorization
    if not session_token:
        print("[ERROR] /recommendations => No session token provided.")
        raise HTTPException(status_code=401, detail="Session token required")
    
    # Pagination
    try:
        offset = int(data.get("offset", 0))
        limit = int(data.get("limit", 20))
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid pagination parameters")

    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        # Validate session token
        with conn.cursor() as cur:
            cur.execute("""
                SELECT users.user_id, sessions.session_id, users.office_id
                FROM sessions
                JOIN users ON sessions.user_id = users.user_id
                WHERE sessions.session_token = %s AND sessions.expires_at > NOW()
            """, (session_token,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id, session_id, office_id = sess_row

        # Get filters from request
        topics = data.get("topics", [])
        date_min = data.get("date_min")
        articles = data.get("articles", [])

        # Fetch articles with filters
        all_articles = fetch_articles(conn, topics=topics, date_min=date_min, articles=articles, offset=0, limit=999999)
        total_count = len(all_articles)
        if total_count == 0:
            return {"recommendations": [], "total_count": 0}

        # Gather MAB stats using individual user data
        article_ids = [a["url_id"] for a in all_articles]
        mab_stats_query = """
            SELECT url_id,
                   SUM(pull_impressions) AS total_impressions,
                   SUM(pull_clicks) AS total_clicks
            FROM user_article_stats
            WHERE user_id = %s
              AND url_id = ANY(%s)
            GROUP BY url_id;
        """

        stats_dict = {}
        total_pulls = 0
        with conn.cursor() as cur:
            cur.execute(mab_stats_query, (user_id, list(article_ids)))
            rows = cur.fetchall()
            for url_id, impressions, clicks in rows:
                N = impressions or 0
                S = clicks or 0
                stats_dict[url_id] = (N, S)
                total_pulls += N

        # MAB ranking
        t = max(total_pulls, 1)
        ranked_list = rank_articles_hellinger_ucb(article_ids, stats_dict, t, c=C_PARAM)
        ucb_map = {aid: ucb for (aid, ucb) in ranked_list}

        # (Optional) LOG ephemeral MAB data with filters
        if LOG_MAB_RANKS:
            print("[DEBUG] => MAB rank logging is ENABLED; inserting ephemeral data into mab_rank_logs.")
            with conn.cursor() as cur:
                for rank_idx, (u_id, ucb_val) in enumerate(ranked_list):
                    rank_position = rank_idx + 1
                    N, S = stats_dict.get(u_id, (0, 0))
                    cur.execute("""
                        INSERT INTO mab_rank_logs (
                            office_id, user_id, session_id,
                            url_id, rank_position,
                            impressions_count, clicks_count,
                            ucb_value, time_index_t, c_param,
                            filter_topics, filter_date
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::text[], %s)
                    """, (
                        office_id,
                        user_id,
                        session_id,
                        u_id,
                        rank_position,
                        N,
                        S,
                        float(ucb_val),
                        t,
                        C_PARAM,
                        topics,    # Pass actual topics filter
                        date_min   # Pass actual date filter
                    ))
            conn.commit()

        # Sort articles based on MAB ranking
        all_articles.sort(key=lambda a: ucb_map.get(a["url_id"], 0.0), reverse=True)

        # Paginate
        paged_articles = all_articles[offset : offset + limit]

        # Insert pulls and log impressions
        pull_ids = []
        with conn.cursor() as cur:
            for article in paged_articles:
                cur.execute("""
                    INSERT INTO pulls (
                        user_id, url_id, office_id,
                        filter_topics, filter_date,
                        page_offset, created_at
                    )
                    VALUES (%s, %s, %s, %s::text[], %s, %s, NOW())
                    RETURNING pull_id;
                """, (
                    user_id, article["url_id"], office_id,
                    topics,    # Pass actual topics filter
                    date_min,  # Pass actual date filter
                    offset
                ))
                new_pull_id = cur.fetchone()[0]
                pull_ids.append(new_pull_id)

                cur.execute("""
                    INSERT INTO user_article_stats (
                        office_id, user_id, url_id, pull_id,
                        pull_impressions, pull_clicks,
                        pull_bookmarks, pull_adds
                    )
                    VALUES (%s, %s, %s, %s, 0, 0, 0, 0)
                    ON CONFLICT (office_id, user_id, url_id, pull_id)
                    DO NOTHING;
                """, (
                    office_id,
                    user_id,
                    article["url_id"],
                    new_pull_id
                ))
            conn.commit()

        # Log impressions
        log_impressions(
            conn,
            user_id,
            [a["url_id"] for a in paged_articles],
            session_id,
            pull_ids,
            office_id
        )

        return {"recommendations": paged_articles, "total_count": total_count}
    except Exception as e:
        print("[ERROR] /recommendations => Exception encountered:")
        print(traceback.format_exc())
        conn.rollback()
        raise HTTPException(status_code=500, detail="An internal error occurred.")
    finally:
        conn.close()



# @app.post("/api/recommendations")
# def get_recommendations(data: dict = Body(...), authorization: str = Header(None, alias="Authorization")):
#     print(f"[DEBUG] /recommendations => Received request payload: {data} (type: {type(data)})")
    
#     session_token = authorization
#     if not session_token:
#         print("[ERROR] /recommendations => No session token provided.")
#         raise HTTPException(status_code=401, detail="Session token required")
    
#     # Pagination
#     try:
#         offset = int(data.get("offset", 0))
#         limit = int(data.get("limit", 20))
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail="Invalid pagination parameters")

#     conn = connect_db()
#     if conn is None:
#         raise HTTPException(status_code=500, detail="Database connection failed")

#     try:
#         # Validate session token
#         with conn.cursor() as cur:
#             cur.execute("""
#                 SELECT users.user_id, sessions.session_id, users.office_id
#                 FROM sessions
#                 JOIN users ON sessions.user_id = users.user_id
#                 WHERE sessions.session_token = %s AND sessions.expires_at > NOW()
#             """, (session_token,))
#             sess_row = cur.fetchone()
#             if not sess_row:
#                 raise HTTPException(status_code=401, detail="Invalid or expired session token")
#             user_id, session_id, office_id = sess_row

#         # Get filters from request
#         topics = data.get("topics", [])
#         date_min = data.get("date_min")
#         articles = data.get("articles", [])

#         # Fetch articles with filters
#         all_articles = fetch_articles(conn, topics=topics, date_min=date_min, articles=articles, offset=0, limit=999999)
#         total_count = len(all_articles)
#         if total_count == 0:
#             return {"recommendations": [], "total_count": 0}

#         # Gather MAB stats
#         article_ids = [a["url_id"] for a in all_articles]
#         mab_stats_query = """
#             SELECT url_id,
#                    SUM(pull_impressions) AS total_impressions,
#                    SUM(pull_clicks) AS total_clicks
#             FROM user_article_stats
#             WHERE office_id = %s
#               AND url_id = ANY(%s)
#             GROUP BY url_id;
#         """

#         stats_dict = {}
#         total_pulls = 0
#         with conn.cursor() as cur:
#             cur.execute(mab_stats_query, (office_id, list(article_ids)))
#             rows = cur.fetchall()
#             for url_id, impressions, clicks in rows:
#                 N = impressions or 0
#                 S = clicks or 0
#                 stats_dict[url_id] = (N, S)
#                 total_pulls += N

#         # MAB ranking
#         t = max(total_pulls, 1)
#         ranked_list = rank_articles_hellinger_ucb(article_ids, stats_dict, t, c=C_PARAM)
#         ucb_map = {aid: ucb for (aid, ucb) in ranked_list}

#         # (Optional) LOG ephemeral MAB data with filters
#         if LOG_MAB_RANKS:
#             print("[DEBUG] => MAB rank logging is ENABLED; inserting ephemeral data into mab_rank_logs.")
#             with conn.cursor() as cur:
#                 for rank_idx, (u_id, ucb_val) in enumerate(ranked_list):
#                     rank_position = rank_idx + 1
#                     N, S = stats_dict.get(u_id, (0, 0))
#                     cur.execute("""
#                         INSERT INTO mab_rank_logs (
#                             office_id, user_id, session_id,
#                             url_id, rank_position,
#                             impressions_count, clicks_count,
#                             ucb_value, time_index_t, c_param,
#                             cold_threshold,
#                             filter_topics, filter_date
#                         )
#                         VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::text[], %s)
#                     """, (
#                         office_id,
#                         user_id,
#                         session_id,
#                         u_id,
#                         rank_position,
#                         N,
#                         S,
#                         float(ucb_val),
#                         t,
#                         C_PARAM,
#                         COLD_THRESHOLD,
#                         topics,    # Pass actual topics filter
#                         date_min   # Pass actual date filter
#                     ))
#             conn.commit()

#         # Sort articles based on MAB ranking
#         all_articles.sort(key=lambda a: ucb_map.get(a["url_id"], 0.0), reverse=True)

#         # Paginate
#         paged_articles = all_articles[offset : offset + limit]

#         # Insert pulls and log impressions
#         pull_ids = []
#         with conn.cursor() as cur:
#             for article in paged_articles:
#                 cur.execute("""
#                     INSERT INTO pulls (
#                         user_id, url_id, office_id,
#                         filter_topics, filter_date,
#                         page_offset, created_at
#                     )
#                     VALUES (%s, %s, %s, %s::text[], %s, %s, NOW())
#                     RETURNING pull_id;
#                 """, (
#                     user_id, article["url_id"], office_id,
#                     topics,    # Pass actual topics filter
#                     date_min,  # Pass actual date filter
#                     offset
#                 ))
#                 new_pull_id = cur.fetchone()[0]
#                 pull_ids.append(new_pull_id)

#                 cur.execute("""
#                     INSERT INTO user_article_stats (
#                         office_id, user_id, url_id, pull_id,
#                         pull_impressions, pull_clicks,
#                         pull_bookmarks, pull_adds
#                     )
#                     VALUES (%s, %s, %s, %s, 0, 0, 0, 0)
#                     ON CONFLICT (office_id, user_id, url_id, pull_id)
#                     DO NOTHING;
#                 """, (
#                     office_id,
#                     user_id,
#                     article["url_id"],
#                     new_pull_id
#                 ))
#             conn.commit()

#         # Log impressions
#         log_impressions(
#             conn,
#             user_id,
#             [a["url_id"] for a in paged_articles],
#             session_id,
#             pull_ids,
#             office_id
#         )

#         return {"recommendations": paged_articles, "total_count": total_count}
#     except Exception as e:
#         print("[ERROR] /recommendations => Exception encountered:")
#         print(traceback.format_exc())
#         conn.rollback()
#         raise HTTPException(status_code=500, detail="An internal error occurred.")
#     finally:
#         conn.close()







@app.get("/api/pulls")
def get_pulls(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieve all pulls for the current user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")

    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # Validate session token
            cur.execute("""
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess = cur.fetchone()
            if not sess:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")

            user_id = sess[0]

            # Fetch pulls
            cur.execute("""
                SELECT pull_id, url_id, filter_topics, filter_date, page_offset, created_at
                FROM pulls
                WHERE user_id = %s
                ORDER BY created_at DESC;
            """, (user_id,))
            pulls = cur.fetchall()

            if not pulls:
                raise HTTPException(status_code=404, detail="No pulls found")

            pull_list = [{
                "pull_id": str(p[0]),
                "url_id": p[1],
                "filter_topics": p[2],
                "filter_date": str(p[3]) if p[3] else None,
                "page_offset": p[4],
                "created_at": str(p[5])
            } for p in pulls]

            return {"pulls": pull_list}

    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pulls")
    finally:
        conn.close()


@app.get("/api/user_article_stats")
def get_user_article_stats(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieve per-pull engagement stats for a user, including clicks, impressions, bookmarks, and adds.

    - Returns a history of MAB pulls where the user engaged.
    - Tracks engagement per ranking cycle (pull_id).
    - Shows individual user stats, not office-wide aggregations.
    - Summarizes total engagement across all pulls for the user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")

    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # 1️⃣ Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s 
                  AND expires_at > NOW()
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]

            # 2️⃣ Fetch per-user engagement stats per pull
            cur.execute("""
                SELECT url_id, pull_id, office_id, pull_impressions, pull_clicks, pull_bookmarks, pull_adds
                FROM user_article_stats
                WHERE user_id = %s
                ORDER BY last_interaction DESC
            """, (user_id,))
            stats = cur.fetchall()

            # 3️⃣ Calculate Summary Stats for User Engagement
            cur.execute("""
                SELECT SUM(pull_clicks) AS total_clicks, 
                       SUM(pull_impressions) AS total_impressions, 
                       SUM(pull_bookmarks) AS total_bookmarks,
                       SUM(pull_adds) AS total_adds
                FROM user_article_stats
                WHERE user_id = %s
            """, (user_id,))
            summary_row = cur.fetchone()
            total_clicks = summary_row[0] or 0
            total_impressions = summary_row[1] or 0
            total_bookmarks = summary_row[2] or 0
            total_adds = summary_row[3] or 0

            # **Calculate CTR Dynamically** 
            user_ctr = (total_clicks / total_impressions) if total_impressions > 0 else 0.0

        return {
            "user_article_stats": [
                {
                    "url_id": row[0],
                    "pull_id": row[1],
                    "office_id": row[2],
                    "pull_impressions": row[3],
                    "pull_clicks": row[4],
                    "pull_bookmarks": row[5],
                    "pull_adds": row[6]
                }
                for row in stats
            ],
            "summary": {
                "total_clicks": total_clicks,
                "total_impressions": total_impressions,
                "total_bookmarks": total_bookmarks,
                "total_adds": total_adds,
                "user_ctr": round(user_ctr, 4)
            }
        }

    except psycopg2.Error as e:
        print(f"[ERROR] Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user article stats")
    finally:
        conn.close()



@app.get("/api/user_mab_stats")
def get_user_mab_stats(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieve per-pull engagement stats for all articles for the current user.

    No query params needed. The user_id is determined from the session token.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and get the current user's user_id instead of office_id
            cur.execute("""
                SELECT user_id
                FROM sessions
                WHERE session_token = %s AND expires_at > NOW()
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]

            # Fetch per-pull engagement stats using user-specific data
            cur.execute(
                """
                SELECT url_id,
                       SUM(pull_clicks) AS total_clicks,
                       SUM(pull_impressions) AS total_impressions,
                       SUM(pull_clicks) * 1.0 / NULLIF(SUM(pull_impressions), 0) AS user_ctr,
                       SUM(pull_bookmarks) AS total_bookmarks,
                       SUM(pull_adds) AS total_adds
                FROM user_article_stats
                WHERE user_id = %s
                GROUP BY url_id
                ORDER BY user_ctr DESC
                """,
                (user_id,)
            )
            stats = cur.fetchall()
        
        return {
            "user_mab_stats": [
                {
                    "url_id": row[0],
                    "total_clicks": row[1],
                    "total_impressions": row[2],
                    "user_ctr": round(row[3], 3) if row[3] is not None else 0.0,
                    "total_bookmarks": row[4],
                    "total_adds": row[5]
                }
                for row in stats
            ]
        }
    
    except Exception as e:
        print(f"[ERROR] Failed to fetch MAB stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch MAB statistics")
    
    finally:
        conn.close()



# @app.get("/api/office_mab_stats")
# def get_office_mab_stats(authorization: str = Header(None, alias="Authorization")):
#     """
#     Retrieve per-pull engagement stats for all articles in the office
#     assigned to the currently logged-in user (from session).

#     No query params needed. The office_id is determined by the user's session token.
#     """
#     if not authorization:
#         raise HTTPException(status_code=401, detail="Session token required")
    
#     conn = connect_db()
#     if conn is None:
#         raise HTTPException(status_code=500, detail="Database connection failed")
    
#     try:
#         with conn.cursor() as cur:
#             # 1. Validate session token & get user's office_id
#             cur.execute(
#                 """
#                 SELECT users.office_id
#                 FROM sessions
#                 JOIN users ON sessions.user_id = users.user_id
#                 WHERE sessions.session_token = %s
#                   AND sessions.expires_at > NOW()
#                 """,
#                 (authorization,)
#             )
#             row = cur.fetchone()
#             if not row:
#                 raise HTTPException(status_code=401, detail="Invalid or expired session token")
            
#             office_id = row[0]  # The office_id from the user's record

#             # 2. Fetch per-pull office-wide engagement stats
#             cur.execute(
#                 """
#                 SELECT url_id,
#                        SUM(pull_clicks) AS total_clicks,
#                        SUM(pull_impressions) AS total_impressions,
#                        SUM(pull_clicks) * 1.0 / NULLIF(SUM(pull_impressions), 0) AS office_ctr,
#                        SUM(pull_bookmarks) AS total_bookmarks,
#                        SUM(pull_adds) AS total_adds
#                 FROM user_article_stats
#                 WHERE office_id = %s
#                 GROUP BY url_id
#                 ORDER BY office_ctr DESC
#                 """,
#                 (office_id,)
#             )
#             stats = cur.fetchall()
        
#         return {
#             "office_mab_stats": [
#                 {
#                     "url_id": row[0],
#                     "total_clicks": row[1],
#                     "total_impressions": row[2],
#                     "office_ctr": round(row[3], 3) if row[3] is not None else 0.0,
#                     "total_bookmarks": row[4],
#                     "total_adds": row[5]
#                 }
#                 for row in stats
#             ]
#         }
    
#     except Exception as e:
#         print(f"[ERROR] Failed to fetch MAB stats: {e}")
#         raise HTTPException(status_code=500, detail="Failed to fetch MAB statistics")
    
#     finally:
#         conn.close()

@app.post("/api/interactions")
def log_interaction(request: Request, data: dict = Body(...)):
    """
    Logs user interactions (clicks, adds, bookmarks) and updates `user_article_stats`.

    - Clicks **only counted once per pull_id**.
    - Bookmarks and adds are **cumulative per pull_id**.
    """
    print("[DEBUG] /interactions => Endpoint called.")
    session_token = request.headers.get('Authorization')
    interaction_type = data.get("interaction_type")
    url_id = data.get("url_id")

    # Basic request validations
    if not session_token:
        print("[ERROR] /interactions => Session token missing.")
        raise HTTPException(status_code=401, detail="Session token required")

    if not interaction_type or url_id is None:
        print("[ERROR] /interactions => Missing interaction_type or url_id in request body.")
        raise HTTPException(status_code=400, detail="interaction_type and url_id are required")

    print(f"[DEBUG] /interactions => Request data: interaction_type={interaction_type}, url_id={url_id}")

    conn = connect_db()
    if conn is None:
        print("[ERROR] /interactions => Database connection failed.")
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # 1️⃣ Get user_id and office_id
            print("[DEBUG] /interactions => Validating session...")
            cur.execute("""
                SELECT sessions.user_id, users.office_id
                FROM sessions
                JOIN users ON sessions.user_id = users.user_id
                WHERE sessions.session_token = %s
                AND sessions.expires_at > NOW();
            """, (session_token,))
            sess_row = cur.fetchone()

            if not sess_row:
                print("[ERROR] /interactions => Invalid or expired session token.")
                raise HTTPException(status_code=401, detail="Invalid or expired session token")

            user_id, office_id = sess_row
            print(f"[DEBUG] /interactions => Session validated => user_id={user_id}, office_id={office_id}")

            # 2️ Get latest pull_id for (user_id, url_id)
            print(f"[DEBUG] /interactions => Fetching latest pull_id for user_id={user_id}, url_id={url_id}")
            cur.execute("""
                SELECT pull_id 
                FROM pulls
                WHERE user_id = %s AND url_id = %s
                ORDER BY created_at DESC
                LIMIT 1;
            """, (user_id, url_id))
            pull_row = cur.fetchone()

            if not pull_row:
                print("[ERROR] /interactions => No active pull found for this article (pull_row is None).")
                raise HTTPException(status_code=400, detail="No active pull found for this article")

            pull_id = pull_row[0]
            print(f"[DEBUG] /interactions => Found pull_id={pull_id}")

            # 3️ Insert the raw interaction log and update stats
            if interaction_type == 'click':
                # Check if a click has already been recorded for this user, article, and pull
                cur.execute("""
                    SELECT 1 FROM user_interactions
                    WHERE user_id = %s AND url_id = %s AND pull_id = %s AND interaction_type = 'click'
                    LIMIT 1;
                """, (user_id, url_id, pull_id))
                already_clicked = cur.fetchone()
                if already_clicked:
                    print("[DEBUG] /interactions => Click already recorded for pull_id. Ignoring duplicate click.")
                else:
                    print("[DEBUG] /interactions => Inserting raw interaction log for click into user_interactions...")
                    cur.execute("""
                        INSERT INTO user_interactions (user_id, url_id, pull_id, interaction_type, interaction_time)
                        VALUES (%s, %s, %s, %s, NOW());
                    """, (user_id, url_id, pull_id, interaction_type))
                    print(f"[DEBUG] /interactions => Incrementing pull_clicks for pull_id={pull_id}") # initially pull_clicks + 1 for office mab cold start
                    cur.execute("""
                        UPDATE user_article_stats
                        SET pull_clicks = pull_clicks + 2, 
                            last_interaction = NOW()
                        WHERE office_id = %s 
                          AND user_id = %s 
                          AND url_id = %s 
                          AND pull_id = %s;
                    """, (office_id, user_id, url_id, pull_id))
            else:
                # For interactions that are not 'click', proceed normally
                print("[DEBUG] /interactions => Inserting raw interaction log into user_interactions...")
                cur.execute("""
                    INSERT INTO user_interactions (user_id, url_id, pull_id, interaction_type, interaction_time)
                    VALUES (%s, %s, %s, %s, NOW());
                """, (user_id, url_id, pull_id, interaction_type))
                if interaction_type == 'add':
                    print(f"[DEBUG] /interactions => Incrementing pull_adds for pull_id={pull_id}")
                    cur.execute("""
                        UPDATE user_article_stats
                        SET pull_adds = pull_adds + 1
                        WHERE office_id = %s 
                          AND user_id = %s 
                          AND url_id = %s 
                          AND pull_id = %s;
                    """, (office_id, user_id, url_id, pull_id))
                elif interaction_type == 'bookmark':
                    print(f"[DEBUG] /interactions => Incrementing pull_bookmarks for pull_id={pull_id}")
                    cur.execute("""
                        UPDATE user_article_stats
                        SET pull_bookmarks = pull_bookmarks + 1,
                            last_interaction = NOW()
                        WHERE office_id = %s 
                          AND user_id = %s 
                          AND url_id = %s 
                          AND pull_id = %s;
                    """, (office_id, user_id, url_id, pull_id))

            print("[DEBUG] /interactions => Successfully updated user_article_stats.")

            conn.commit()
            print("[DEBUG] /interactions => Transaction committed successfully.")

        return {"message": f"{interaction_type} recorded."}

    except psycopg2.Error as e:
        conn.rollback()
        print("[ERROR] /interactions => Database error occurred:", str(e))
        print("[ERROR] /interactions => Rolling back transaction.")
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as ex:
        conn.rollback()
        print("[ERROR] /interactions => Unhandled exception encountered:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="An internal error occurred")
    finally:
        conn.close()
        print("[DEBUG] /interactions => Database connection closed.")


@app.get("/api/articles/count")
def get_articles_count():
    """
    Endpoint to get the total count of articles in the database.
    """
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        query = "SELECT COUNT(*) FROM urls_content;"
        with conn.cursor() as cur:
            cur.execute(query)
            total_count = cur.fetchone()[0]
        return {"total": total_count}
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to fetch total articles count: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch total articles count")
    finally:
        conn.close()


@app.get("/api/articles/dates")
def get_publication_dates():
    """
    Endpoint to retrieve a list of unique publication dates.
    """
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        query = """
        SELECT DISTINCT DATE(publication_date) AS publication_date
        FROM urls_content
        ORDER BY publication_date DESC;
        """
        with conn.cursor() as cur:
            cur.execute(query)
            dates = cur.fetchall()
        # Convert to a list of strings (e.g., "YYYY-MM-DD")
        date_list = [date[0].strftime('%Y-%m-%d') for date in dates if date[0]]
        return {"dates": date_list}
    except psycopg2.Error as e:
        print(f"[ERROR] Database error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch publication dates")
    finally:
        conn.close()


@app.post("/api/add_page")
def add_page(authorization: str = Header(None, alias="Authorization"), data: dict = Body(...)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    url_id = data.get("url_id")
    if not url_id:
        raise HTTPException(status_code=400, detail="url_id is required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and retrieve user_id and office_id.
            cur.execute(
                """
                SELECT user_id, office_id 
                FROM sessions 
                JOIN users USING(user_id)
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id, office_id = session_row

            # Insert into added_pages (with conflict handling)
            cur.execute(
                """
                INSERT INTO added_pages (user_id, url_id, added_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id, url_id)
                DO UPDATE SET added_at = EXCLUDED.added_at, removed_at = NULL;
                """,
                (user_id, url_id)
            )

            # Try to fetch the latest pull_id for the given user and article.
            cur.execute(
                """
                SELECT pull_id 
                FROM pulls
                WHERE user_id = %s AND url_id = %s
                ORDER BY created_at DESC
                LIMIT 1;
                """,
                (user_id, url_id)
            )
            pull_row = cur.fetchone()
            if pull_row:
                pull_id = pull_row[0]

                # Insert a raw "add" interaction into user_interactions.
                cur.execute(
                    """
                    INSERT INTO user_interactions (user_id, url_id, pull_id, interaction_type, interaction_time)
                    VALUES (%s, %s, %s, %s, NOW());
                    """,
                    (user_id, url_id, pull_id, 'add')
                )
                
                # Update aggregated stats for "add" in user_article_stats.
                cur.execute(
                    """
                    UPDATE user_article_stats
                    SET pull_adds = pull_adds + 1,
                        last_interaction = NOW()
                    WHERE office_id = %s 
                      AND user_id = %s 
                      AND url_id = %s 
                      AND pull_id = %s;
                    """,
                    (office_id, user_id, url_id, pull_id)
                )
            else:
                # Optionally, you could decide to log an error or create a pull.
                print("[WARNING] No pull found for user_id %s and url_id %s", user_id, url_id)
        
        conn.commit()
        return {"message": "Page added and interaction logged successfully"}
    
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] /api/add_page encountered an error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add page and log interaction")
    
    finally:
        conn.close()

@app.get("/api/added_pages")
def get_added_pages(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = session_row[0]

            # Fetch added articles with metadata from urls_content
            cur.execute(
                """
                SELECT 
                    ap.url_id, 
                    ap.added_at, 
                    uc.title, 
                    uc.publication_date, 
                    uc.topics_array, 
                    uc.description, 
                    uc.author, 
                    uc.url
                FROM added_pages ap
                JOIN urls_content uc ON ap.url_id = uc.url_id
                WHERE ap.user_id = %s AND ap.removed_at IS NULL
                ORDER BY ap.added_at DESC;
                """,
                (user_id,)
            )
            added_pages = cur.fetchall()

            results = []
            for row in added_pages:
                results.append({
                    "url_id": row[0],
                    "added_at": str(row[1]),
                    "title": row[2],
                    "publication_date": str(row[3]) if row[3] else None,
                    "topics_array": row[4],
                    "description": row[5],
                    "author": row[6],
                    "url": row[7]
                })

        return {"added_pages": results}
    
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch added pages")
    
    finally:
        conn.close()


@app.delete("/api/added_pages/{url_id}")
def remove_added_page(url_id: int, authorization: str = Header(None, alias="Authorization")):
    """
    Remove an added page by setting its removed_at timestamp.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = session_row[0]
            
            # Update added_pages to mark the page as removed
            cur.execute(
                """
                UPDATE added_pages
                SET removed_at = NOW()
                WHERE user_id = %s AND url_id = %s AND removed_at IS NULL
                """,
                (user_id, url_id)
            )
            conn.commit()
            return {"message": "Page removed successfully"}
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to remove added page")
    finally:
        conn.close()


@app.get("/api/added_pages/details")
def get_added_pages_details(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieve all added pages details (only pages that haven't been removed).
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and retrieve the user's id.
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
                """,
                (authorization,)
            )
            sess = cur.fetchone()
            if not sess:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess[0]
            
            # Join added_pages and urls_content on url_id.
            cur.execute(
                """
                SELECT ac.url_id, uc.title, uc.publication_date, uc.author, uc.url
                FROM added_pages ac
                JOIN urls_content uc ON ac.url_id = uc.url_id
                WHERE ac.user_id = %s AND ac.removed_at IS NULL
                ORDER BY ac.added_at DESC;
                """,
                (user_id,)
            )
            rows = cur.fetchall()
            
            added_pages_data = [
                {
                    "url_id": row[0],
                    "title": row[1],
                    "publication_date": row[2].isoformat() if row[2] else None,
                    "author": row[3],
                    "url": row[4]
                }
                for row in rows
            ]
        return {"added_pages": added_pages_data}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

        
@app.get("/api/bookmarks")
def get_bookmarks(authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            # Validate session token and get user_id.
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = session_row[0]
            # Fetch bookmarks along with metadata and the new grouping field.
            cur.execute(
                """
                SELECT 
                    b.url_id,
                    b.bookmarked_at,
                    uc.title,
                    uc.publication_date,
                    uc.topics_array,
                    uc.description,
                    uc.author,
                    uc.url,
                    b.journal_series_id
                FROM bookmarks b
                JOIN urls_content uc ON b.url_id = uc.url_id
                WHERE b.user_id = %s AND b.removed_at IS NULL
                ORDER BY b.bookmarked_at DESC;
                """,
                (user_id,)
            )
            bookmark_rows = cur.fetchall()
            results = []
            for row in bookmark_rows:
                bookmark = {
                    "url_id": row[0],
                    "bookmarked_at": str(row[1]) if row[1] else None,
                    "title": row[2],
                    "publication_date": str(row[3]) if row[3] else None,
                    "topics_array": row[4],
                    "description": row[5],
                    "author": row[6],
                    "url": row[7],
                    "journal_series_id": row[8]
                }
                results.append(bookmark)
            return {"bookmarks": results}
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookmarks")
    finally:
        conn.close()


@app.post("/api/add_bookmark")
def add_bookmark(authorization: str = Header(None, alias="Authorization"), data: dict = Body(...)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    url_id = data.get("url_id")
    if not url_id:
        raise HTTPException(status_code=400, detail="url_id is required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            # Validate session token and retrieve user_id and office_id.
            cur.execute(
                """
                SELECT user_id, office_id 
                FROM sessions 
                JOIN users USING(user_id)
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id, office_id = session_row
            # Insert into bookmarks (with conflict handling)
            cur.execute(
                """
                INSERT INTO bookmarks (user_id, url_id, bookmarked_at)
                VALUES (%s, %s, NOW())
                ON CONFLICT (user_id, url_id)
                DO UPDATE SET bookmarked_at = EXCLUDED.bookmarked_at, removed_at = NULL;
                """,
                (user_id, url_id)
            )
            # Try to fetch the latest pull_id for the given user and article.
            cur.execute(
                """
                SELECT pull_id 
                FROM pulls
                WHERE user_id = %s AND url_id = %s
                ORDER BY created_at DESC
                LIMIT 1;
                """,
                (user_id, url_id)
            )
            pull_row = cur.fetchone()
            if pull_row:
                pull_id = pull_row[0]
                # Log the raw "bookmark" interaction into user_interactions.
                cur.execute(
                    """
                    INSERT INTO user_interactions (user_id, url_id, pull_id, interaction_type, interaction_time)
                    VALUES (%s, %s, %s, %s, NOW());
                    """,
                    (user_id, url_id, pull_id, 'bookmark')
                )
                # Update aggregated stats for "bookmark" in user_article_stats.
                cur.execute(
                    """
                    UPDATE user_article_stats
                    SET pull_bookmarks = pull_bookmarks + 1,
                        last_interaction = NOW()
                    WHERE office_id = %s 
                      AND user_id = %s 
                      AND url_id = %s 
                      AND pull_id = %s;
                    """,
                    (office_id, user_id, url_id, pull_id)
                )
            else:
                print("[WARNING] No pull found for user_id %s and url_id %s", user_id, url_id)
        conn.commit()
        return {"message": "Bookmark added and interaction logged successfully"}
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] /api/add_bookmark encountered an error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add bookmark and log interaction")
    finally:
        conn.close()


@app.delete("/api/bookmarks/{url_id}")
def remove_bookmark(url_id: int, authorization: str = Header(None, alias="Authorization")):
    """
    Remove a bookmark by setting its removed_at timestamp.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and get user_id.
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = session_row[0]
            
            # Update bookmarks to mark the bookmark as removed.
            cur.execute(
                """
                UPDATE bookmarks
                SET removed_at = NOW()
                WHERE user_id = %s AND url_id = %s AND removed_at IS NULL
                """,
                (user_id, url_id)
            )
            conn.commit()
            return {"message": "Bookmark removed successfully"}
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to remove bookmark")
    finally:
        conn.close()


@app.get("/api/bookmarks_candidates")
def get_bookmark_candidates(authorization: str = Header(None, alias="Authorization")):
    """
    For each bookmarked article, scan all scraped articles (urls_content)
    and use fuzzy matching on the title. If the similarity is above a given
    threshold (e.g., >= 90), consider it a candidate updated version.
    Exclude any articles already in the user's bookmarks from the results.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # 1) Validate session token & get user_id.
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s 
                  AND expires_at > NOW()
                """,
                (authorization,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = row[0]
            
            # 2) Get all the user's active bookmarks for exclusion.
            cur.execute(
                """
                SELECT url_id 
                FROM bookmarks
                WHERE user_id = %s
                  AND removed_at IS NULL
                """,
                (user_id,)
            )
            already_bookmarked = set(b[0] for b in cur.fetchall())
            
            # 3) Fetch all active bookmarks for this user along with their title.
            cur.execute(
                """
                SELECT 
                    b.url_id,
                    b.bookmarked_at,
                    uc.title,
                    uc.publication_date
                FROM bookmarks b
                JOIN urls_content uc ON b.url_id = uc.url_id
                WHERE b.user_id = %s AND b.removed_at IS NULL
                """,
                (user_id,)
            )
            user_bookmarks = cur.fetchall()
            
            similarity_threshold = 85
            candidates = []
            unique_candidate_ids = set()
            
            for bm in user_bookmarks:
                original_url_id, bookmarked_at, original_title, original_pub_date = bm
                
                # 4) Find all articles that are NOT the same URL and NOT already bookmarked.
                cur.execute(
                    """
                    SELECT url_id, title, publication_date
                    FROM urls_content
                    WHERE url_id != %s
                    AND url_id NOT IN %s
                    """,
                    (original_url_id, tuple(already_bookmarked))
                )
                all_articles = cur.fetchall()
                
                # 5) Fuzzy match each candidate.
                for article in all_articles:
                    candidate_url_id, candidate_title, candidate_pub_date = article
                    similarity = fuzz.ratio(original_title, candidate_title)
                    if similarity >= similarity_threshold:
                        if candidate_url_id not in unique_candidate_ids:
                            candidate = {
                                "user_id": user_id,
                                "original_url_id": original_url_id,
                                "candidate_url_id": candidate_url_id,
                                "bookmarked_at": bookmarked_at,
                                "original_title": original_title,
                                "candidate_title": candidate_title,
                                "candidate_publication_date": candidate_pub_date,
                                "similarity": similarity
                            }
                            candidates.append(candidate)
                            unique_candidate_ids.add(candidate_url_id)
            
            # 6) Sort candidates by publication date in ascending order.
            candidates.sort(key=lambda candidate: candidate["candidate_publication_date"])
            
            # 7) Return the candidate list in the response.
            return {"bookmark_candidates": candidates}
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch bookmark candidates")
    finally:
        conn.close()
@app.post("/api/confirm_bookmark_candidate")
def confirm_bookmark_candidate(authorization: str = Header(None, alias="Authorization"), data: dict = Body(...)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")

    original_url_id = data.get("original_url_id")
    candidate_url_id = data.get("candidate_url_id")
    if original_url_id is None or candidate_url_id is None:
        raise HTTPException(status_code=400, detail="Both original_url_id and candidate_url_id are required")

    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")

    try:
        with conn.cursor() as cur:
            # Validate session token and get user_id.
            cur.execute(
                """
                SELECT user_id 
                FROM sessions 
                WHERE session_token = %s AND expires_at > NOW()
                """,
                (authorization,)
            )
            session_row = cur.fetchone()
            if not session_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = session_row[0]

            # Optionally verify candidate exists in urls_content.
            cur.execute(
                """
                SELECT url 
                FROM urls_content
                WHERE url_id = %s
                """,
                (candidate_url_id,)
            )
            candidate_record = cur.fetchone()
            if not candidate_record:
                raise HTTPException(status_code=404, detail="Candidate article not found")

            # Retrieve the original bookmark's journal_series_id if it exists,
            # otherwise default to the original_url_id.
            cur.execute(
                """
                SELECT COALESCE(journal_series_id, url_id) as series_id
                FROM bookmarks
                WHERE user_id = %s AND url_id = %s
                """,
                (user_id, original_url_id)
            )
            result = cur.fetchone()
            if result:
                series_id = result[0]
            else:
                series_id = original_url_id

            # Insert a new bookmark row for the candidate article,
            # setting journal_series_id to the consistent series_id.
            cur.execute(
                """
                INSERT INTO bookmarks (user_id, url_id, bookmarked_at, journal_series_id)
                VALUES (%s, %s, NOW(), %s)
                ON CONFLICT (user_id, url_id)
                DO UPDATE SET 
                  bookmarked_at = EXCLUDED.bookmarked_at,
                  removed_at = NULL,
                  journal_series_id = EXCLUDED.journal_series_id;
                """,
                (user_id, candidate_url_id, series_id)
            )
            conn.commit()
        return {"message": "Bookmark candidate confirmed successfully"}
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to confirm bookmark candidate")
    finally:
        conn.close()



@app.get("/api/mab_rank_logs")
def get_mab_rank_logs(
    office_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    session_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """
    Retrieve the latest MAB ranking data from the mab_rank_logs table.
    Instead of returning all logs, returns only the rows whose created_at matches the latest value.
    Optional query params:
      - office_id
      - user_id
      - session_id
      - start_date (YYYY-MM-DD)
      - end_date (YYYY-MM-DD)
    """
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Base query to select all columns from mab_rank_logs.
    base_query = """
        SELECT
            mab_rank_log_id,
            created_at,
            office_id,
            user_id,
            session_id,
            url_id,
            rank_position,
            impressions_count,
            clicks_count,
            ucb_value,
            time_index_t,
            c_param,
            filter_topics,
            filter_date
        FROM mab_rank_logs
        WHERE 1=1
    """
    filters = []
    params = []
    
    if office_id:
        filters.append("AND office_id = %s")
        params.append(office_id)
    if user_id:
        filters.append("AND user_id = %s")
        params.append(user_id)
    if session_id:
        filters.append("AND session_id = %s")
        params.append(session_id)
    if start_date:
        filters.append("AND created_at >= %s")
        params.append(start_date)
    if end_date:
        filters.append("AND created_at <= %s")
        params.append(end_date)
    
    # Combine into a CTE, then select only the rows with the latest created_at.
    final_query = f"""
        WITH filtered_logs AS (
            {base_query} {' '.join(filters)}
        )
        SELECT *
        FROM filtered_logs
        WHERE created_at = (SELECT MAX(created_at) FROM filtered_logs)
        ORDER BY created_at DESC
    """
    
    try:
        with conn.cursor() as cur:
            cur.execute(final_query, tuple(params))
            rows = cur.fetchall()
            result = []
            for row in rows:
                result.append({
                    "mab_rank_log_id": row[0],
                    "created_at": row[1].isoformat() if row[1] else None,
                    "office_id": str(row[2]) if row[2] else None,
                    "user_id": str(row[3]) if row[3] else None,
                    "session_id": str(row[4]) if row[4] else None,
                    "url_id": row[5],
                    "rank_position": row[6],
                    "impressions_count": row[7],
                    "clicks_count": row[8],
                    "ucb_value": row[9],
                    "time_index_t": row[10],
                    "c_param": row[11],
                    "filter_topics": row[12],
                    "filter_date": row[13].isoformat() if row[13] else None
                })
        return {"mab_rank_logs": result}
    except Exception as e:
        print(f"[ERROR] Failed to fetch mab_rank_logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mab_rank_logs")
    finally:
        conn.close()


@app.get("/api/office_users")
def get_office_users(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieve office users by validating the session token then joining users with offices.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and get the user's office_id.
            cur.execute(
                """
                SELECT u.office_id 
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_token = %s AND s.expires_at > NOW();
                """,
                (authorization,)
            )
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            office_id = row[0]
            
            # Join users with offices to fetch the office_code.
            cur.execute(
                """
                SELECT u.created_at, u.username, o.office_code
                FROM users u
                JOIN offices o ON u.office_id = o.office_id
                WHERE u.office_id = %s;
                """,
                (office_id,)
            )
            results = cur.fetchall()
            users = []
            for r in results:
                created_at = r[0]
                if created_at is not None:
                    created_at = created_at.strftime('%Y-%m-%d %H:%M:%S')
                users.append({
                    "created_at": created_at,
                    "username": r[1],
                    "office_code": r[2]
                })
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()




@app.get("/api/office_user_interactions")
def get_office_user_interactions(authorization: str = Header(None, alias="Authorization")):
    """
    Retrieves office user interactions for users in the same office as the logged-in user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Validate session token and get the user's office_id.
            cur.execute("""
                SELECT u.office_id 
                FROM sessions s
                JOIN users u ON s.user_id = u.user_id
                WHERE s.session_token = %s AND s.expires_at > NOW();
            """, (authorization,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            office_id = row[0]
            
            # Revised join: using d.defensenews_url_id instead of d.url_id.
            cur.execute("""
                SELECT u.username, uc.title, d.defensenews_url, ui.interaction_type, ui.interaction_time
                FROM user_interactions ui
                JOIN users u ON ui.user_id = u.user_id
                JOIN urls_content uc ON ui.url_id = uc.url_id
                LEFT JOIN defensenews_urls d ON ui.url_id = d.defensenews_url_id
                WHERE u.office_id = %s
                ORDER BY ui.interaction_time DESC;
            """, (office_id,))
            results = cur.fetchall()
            
            interactions = []
            for r in results:
                interaction_time = r[4]
                # Format the datetime into a more palatable format.
                if isinstance(interaction_time, datetime):
                    interaction_time = interaction_time.strftime('%Y-%m-%d %H:%M:%S')
                else:
                    interaction_time = str(interaction_time)
                interactions.append({
                    "username": r[0],
                    "title": r[1],
                    "defensenews_url": r[2],
                    "interaction_type": r[3],
                    "interaction_time": interaction_time
                })
        
        return {"user_interactions": interactions}
    except Exception as e:
        print(f"[ERROR] get_office_user_interactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()



@app.post("/api/templates", status_code=201)
def create_template(data: dict = Body(...), authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    name = data.get("name")
    description = data.get("description")
    content = data.get("content")  # This contains the sections data
    
    if not name or not content:
        raise HTTPException(status_code=400, detail="Template name and content are required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]
    
            # Insert template
            cur.execute("""
                INSERT INTO templates (name, description, created_by)
                VALUES (%s, %s, %s)
                RETURNING template_id;
            """, (name, description, user_id))
            template_id = cur.fetchone()[0]

            # Insert sections recursively
            def insert_sections(sections, parent_id=None, order_start=0):
                for i, section in enumerate(sections, start=order_start):
                    cur.execute("""
                        INSERT INTO template_sections 
                        (template_id, parent_section_id, section_order, section_title, article_title, command)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING section_id;
                    """, (
                        template_id,
                        parent_id,
                        i,
                        section.get("sectionTitle"),
                        section.get("articleTitle"),
                        section.get("command")
                    ))
                    section_id = cur.fetchone()[0]
                    
                    # Recursively insert subsections
                    if section.get("subsections"):
                        insert_sections(section["subsections"], section_id, 0)

            # Insert the sections
            insert_sections(content.get("sections", []))

            # Log creation in history
            cur.execute("""
                INSERT INTO template_history 
                (template_id, modified_by, change_type, change_description)
                VALUES (%s, %s, %s, %s);
            """, (template_id, user_id, 'CREATED', 'Template created'))

            conn.commit()
            return {"template_id": template_id, "message": "Template created successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
            conn.close()

@app.get("/api/templates")
def get_templates(
    archived: bool = Query(False),
    limit: int = Query(10),
    offset: int = Query(0),
    authorization: str = Header(None, alias="Authorization")
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]
    
            # Get templates
            cur.execute("""
                SELECT template_id, name, description, created_at, updated_at, is_archived
                FROM templates 
                WHERE created_by = %s AND is_archived = %s
                ORDER BY updated_at DESC
                LIMIT %s OFFSET %s;
            """, (user_id, archived, limit, offset))
            
            templates = [{
                "template_id": row[0],
                "name": row[1],
                "description": row[2],
                "created_at": row[3].isoformat(),
                "updated_at": row[4].isoformat(),
                "is_archived": row[5]
            } for row in cur.fetchall()]

            return {"templates": templates}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/templates/{template_id}")
def get_template(template_id: int, authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]
    
            # Get template metadata
            cur.execute("""
                SELECT name, description, created_at, updated_at, is_archived
                FROM templates 
                WHERE template_id = %s AND created_by = %s;
            """, (template_id, user_id))
            template_row = cur.fetchone()
            
            if not template_row:
                raise HTTPException(status_code=404, detail="Template not found")

            # Get template sections using recursive query
            cur.execute("""
                WITH RECURSIVE section_tree AS (
                    SELECT 
                        section_id, 
                        template_id,
                        parent_section_id,
                        section_title,
                        article_title,
                        command,
                        section_order,
                        1 as level
                    FROM template_sections
                    WHERE parent_section_id IS NULL AND template_id = %s
                    
                    UNION ALL
                    
                    SELECT 
                        c.section_id,
                        c.template_id,
                        c.parent_section_id,
                        c.section_title,
                        c.article_title,
                        c.command,
                        c.section_order,
                        p.level + 1
                    FROM template_sections c
                    JOIN section_tree p ON c.parent_section_id = p.section_id
                )
                SELECT * FROM section_tree
                ORDER BY level, section_order;
            """, (template_id,))
            
            sections = []
            section_map = {}
            
            # Build section tree
            for row in cur.fetchall():
                section = {
                    "section_id": row[0],
                    "section_title": row[3],
                    "article_title": row[4],
                    "command": row[5],
                    "subsections": []
                }
                section_map[row[0]] = section
                
                if row[2] is None:  # top-level section
                    sections.append(section)
                else:  # subsection
                    parent = section_map[row[2]]
                    parent["subsections"].append(section)

            return {
                "template_id": template_id,
                "name": template_row[0],
                "description": template_row[1],
                "created_at": template_row[2].isoformat(),
                "updated_at": template_row[3].isoformat(),
                "is_archived": template_row[4],
                "sections": sections
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/templates/{template_id}")
def update_template(
    template_id: int,
    data: dict = Body(...),
    authorization: str = Header(None, alias="Authorization")
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    name = data.get("name")
    description = data.get("description")
    content = data.get("content")  # This contains the sections data
    
    if not name or not content:
        raise HTTPException(status_code=400, detail="Template name and content are required")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]
    
            # Verify template exists and belongs to user
            cur.execute("""
                SELECT template_id FROM templates
                WHERE template_id = %s AND created_by = %s;
            """, (template_id, user_id))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Template not found")

            # Update template metadata
            cur.execute("""
                UPDATE templates
                SET name = %s,
                    description = %s,
                    updated_at = NOW()
                WHERE template_id = %s;
            """, (name, description, template_id))

            # Delete existing sections
            cur.execute("DELETE FROM template_sections WHERE template_id = %s;", (template_id,))

            # Insert new sections recursively
            def insert_sections(sections, parent_id=None, order_start=0):
                for i, section in enumerate(sections, start=order_start):
                    cur.execute("""
                        INSERT INTO template_sections 
                        (template_id, parent_section_id, section_order, section_title, article_title, command)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING section_id;
                    """, (
                        template_id,
                        parent_id,
                        i,
                        section.get("sectionTitle"),
                        section.get("articleTitle"),
                        section.get("command")
                    ))
                    section_id = cur.fetchone()[0]
                    
                    # Recursively insert subsections
                    if section.get("subsections"):
                        insert_sections(section["subsections"], section_id, 0)

            # Insert the sections
            insert_sections(content.get("sections", []))

            # Log update in history
            cur.execute("""
                INSERT INTO template_history 
                (template_id, modified_by, change_type, change_description)
                VALUES (%s, %s, %s, %s);
            """, (template_id, user_id, 'UPDATED', 'Template updated'))

            conn.commit()
            return {"message": "Template updated successfully"}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.patch("/api/templates/{template_id}/archive")
def archive_template(
    template_id: int,
    data: dict = Body(...),
    authorization: str = Header(None, alias="Authorization")
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    
    is_archived = data.get("is_archived")
    if is_archived is None:
        raise HTTPException(status_code=400, detail="is_archived field is required")
    
    print(f"[DEBUG] Archiving template {template_id}, is_archived={is_archived}")
    
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        with conn.cursor() as cur:
            # Get user_id from session
            cur.execute("""
                SELECT user_id FROM sessions 
                WHERE session_token = %s AND expires_at > NOW();
            """, (authorization,))
            sess_row = cur.fetchone()
            if not sess_row:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess_row[0]
    
            print(f"[DEBUG] User {user_id} attempting to archive template {template_id}")

            # First check if template exists and belongs to user
            cur.execute("""
                SELECT template_id, is_archived
                FROM templates
                WHERE template_id = %s AND created_by = %s::uuid;
            """, (template_id, user_id))
            
            template_row = cur.fetchone()
            if not template_row:
                raise HTTPException(status_code=404, detail="Template not found")
            
            current_archive_status = template_row[1]
            if current_archive_status == is_archived:
                return {"message": f"Template already {'archived' if is_archived else 'unarchived'}"}

            # Update archive status - Note the cast to UUID
            cur.execute("""
                UPDATE templates
                SET is_archived = %s,
                    archived_at = CASE WHEN %s THEN NOW() ELSE NULL END,
                    archived_by = CASE WHEN %s THEN %s::uuid ELSE NULL END,
                    updated_at = NOW()
                WHERE template_id = %s AND created_by = %s::uuid
                RETURNING template_id;
            """, (is_archived, is_archived, is_archived, user_id, template_id, user_id))
            
            if cur.rowcount == 0:
                print(f"[ERROR] Failed to update template {template_id} archive status")
                raise HTTPException(status_code=500, detail="Failed to update template archive status")

            # Log change in history
            change_type = 'ARCHIVED' if is_archived else 'UNARCHIVED'
            cur.execute("""
                INSERT INTO template_history 
                (template_id, modified_by, change_type, change_description)
                VALUES (%s, %s::uuid, %s, %s);
            """, (template_id, user_id, change_type, f"Template {change_type.lower()}"))

            conn.commit()
            print(f"[DEBUG] Successfully {change_type.lower()} template {template_id}")
            return {"message": f"Template {change_type.lower()} successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[ERROR] Failed to archive template {template_id}: {str(e)}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to archive template: {str(e)}")
    finally:
        conn.close()

@app.post("/api/articles/filter")
def filter_articles(data: dict = Body(...), authorization: str = Header(None, alias="Authorization")):
    if not authorization:
        raise HTTPException(status_code=401, detail="Session token required")
    conn = connect_db()
    if conn is None:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM sessions WHERE session_token = %s AND expires_at > NOW()", (authorization,))
            sess = cur.fetchone()
            if not sess:
                raise HTTPException(status_code=401, detail="Invalid or expired session token")
            user_id = sess[0]
        
        topics = data.get("topics", [])
        if isinstance(topics, str):
            try:
                topics = json.loads(topics)
            except Exception as e:
                topics = []
        if not isinstance(topics, list):
            topics = []
        
        articles = data.get("articles", [])
        if isinstance(articles, str):
            try:
                articles = json.loads(articles)
            except Exception as e:
                articles = []
        if not isinstance(articles, list):
            articles = []
        
        # Log the original payload for debugging
        print(f"[DEBUG] filter_articles payload: {data}")

        # Resolve the date filter from multiple possible keys
        date_min = data.get("date_min")
        if not date_min or date_min in ["null", ""]:
            date_min = data.get("dateMin")
        if (not date_min or date_min in ["null", ""]) and data.get("dates"):
            dates_val = data.get("dates")
            if isinstance(dates_val, str):
                try:
                    dates_val = json.loads(dates_val)
                except Exception as e:
                    dates_val = []
            if isinstance(dates_val, list) and len(dates_val) > 0:
                date_min = dates_val[0]
        if date_min in ["null", "", None]:
            date_min = None

        print(f"[DEBUG] Resolved filters: topics: {topics}, articles: {articles}, date_min: {date_min}")
        
        try:
            offset = int(data.get("offset", 0))
            limit = int(data.get("limit", 20))
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid pagination parameters")
        
        filtered_articles = fetch_articles(conn, topics=topics, date_min=date_min, articles=articles, offset=offset, limit=limit)
        total_count = len(fetch_articles(conn, topics=topics, date_min=date_min, articles=articles, offset=0, limit=999999))
        return {"recommendations": filtered_articles, "total_count": total_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal error occurred.")
    finally:
        conn.close()