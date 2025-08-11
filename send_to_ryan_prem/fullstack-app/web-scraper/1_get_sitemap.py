import requests
import xml.etree.ElementTree as ET
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import psycopg2
from psycopg2 import sql, errors
import os
import psycopg2
from db_utils import connect_db


conn = connect_db()

# Email settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "adumas97@gmail.com"
EMAIL_PASSWORD = "zpez mrym dpzu igwr"
EMAIL_RECIPIENT = "adumas97@gmail.com"

def get_all_loc_elements(sitemap_url):
    """
    Fetches all <loc> elements from the given sitemap URL.
    """
    try:
        response = requests.get(sitemap_url, timeout=10)
        response.raise_for_status()
        root = ET.fromstring(response.content)
        loc_elements = [loc.text.strip() for loc in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
        return loc_elements
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Could not fetch sitemap: {e}")
        return []
    except ET.ParseError as e:
        print(f"[ERROR] Could not parse XML: {e}")
        return []

#def connect_db():
 #   """
  #  Establishes a connection to the PostgreSQL database.
 #   """
#    try:
     #   conn = psycopg2.connect(**DB_PARAMS)
    #    return conn
   # except psycopg2.DatabaseError as e:
  #      print(f"[ERROR] Database connection failed: {e}")
 #       return None

def create_table_if_not_exists(conn):
    """
    Creates the scraped_urls table if it doesn't exist.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS sitemap_urls (
        id SERIAL PRIMARY KEY,
        sitemap_url TEXT UNIQUE NOT NULL,
        scraped_at TIMESTAMP NOT NULL
    );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
            conn.commit()
            print("[INFO] Table 'sitemap_urls' is ready.")
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to create table: {e}")
        conn.rollback()

def insert_url(conn, url):
    """
    Inserts a new URL into the database with the current timestamp or indicates if it already exists.
    """
    # Check if the URL already exists
    check_query = "SELECT EXISTS (SELECT 1 FROM sitemap_urls WHERE sitemap_url = %s);"
    insert_query = """
    INSERT INTO sitemap_urls (sitemap_url, scraped_at)
    VALUES (%s, %s)
    ON CONFLICT (sitemap_url) DO NOTHING;
    """
    try:
        with conn.cursor() as cur:
            # Check if URL exists
            cur.execute(check_query, (url,))
            exists = cur.fetchone()[0]

            if exists:
                print(f"[INFO] URL already exists: {url}")
            else:
                # Insert the URL if it doesn't exist
                cur.execute(insert_query, (url, datetime.now()))
                conn.commit()
                print(f"[INFO] New URL inserted: {url}")
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to insert or check URL: {e}")
        conn.rollback()

def process_sitemap(sitemap_url):
    """
    Processes the sitemap and inserts new URLs into the database.
    """
    conn = connect_db()
    if conn is None:
        return

    create_table_if_not_exists(conn)
    new_urls = get_all_loc_elements(sitemap_url)
    for url in new_urls:
        insert_url(conn, url)

    conn.close()

if __name__ == "__main__":
    main_sitemap_url = "https://www.defensenews.com/arc/outboundfeeds/sitemap-index/?outputType=xml"
    process_sitemap(main_sitemap_url)
