

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
