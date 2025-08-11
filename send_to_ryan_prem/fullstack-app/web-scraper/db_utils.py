# import os
# from dotenv import load_dotenv
# import psycopg2

# # ✅ Explicitly load `.env` from the parent directory
# dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../.env'))
# load_dotenv(dotenv_path)

# # ✅ Secure Database Credentials
# DB_PARAMS = {
#     'dbname': os.getenv("DB_NAME"),
#     'user': os.getenv("DB_USER"),
#     'password': os.getenv("DB_PASSWORD"),
#     'host': os.getenv("DB_HOST"),
#     'port': os.getenv("DB_PORT", "5432")
# }

# print("[DEBUG] DB_NAME:", os.getenv("DB_NAME"))
# print("[DEBUG] DB_USER:", os.getenv("DB_USER"))
# print("[DEBUG] DB_HOST:", os.getenv("DB_HOST"))


# def connect_db():
#     """Establish a secure database connection."""
#     try:
#         conn = psycopg2.connect(**DB_PARAMS)
#         return conn
#     except psycopg2.Error as e:
#         print(f"[ERROR] Database connection failed: {e}")
#         return None


# database/db_utils.py




import os
import psycopg2

def connect_db():
    host = os.environ.get("DB_HOST", "db")
    port = os.environ.get("DB_PORT", 5432)
    user = os.environ.get("DB_USER", "sbt")
    password = os.environ.get("DB_PASSWORD", "41998")
    database = os.environ.get("DB_NAME", "defensenews_webscraper")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        return conn
    except Exception as e:
        print("[ERROR] Database connection failed:", e)
        return None
