import requests
import xml.etree.ElementTree as ET
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import psycopg2
from psycopg2 import sql, errors
from bs4 import BeautifulSoup
import re
from tqdm import tqdm
from dateutil.parser import parse as parse_date
import os
from db_utils import connect_db


conn = connect_db()


# Email settings
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "adumas97@gmail.com"
EMAIL_PASSWORD = "zpez mrym dpzu igwr"
EMAIL_RECIPIENT = "adumas97@gmail.com"

TEST_URL = "https://www.defensenews.com/global/mideast-africa/2025/01/02/israel-creates-hub-to-hasten-military-ai-autonomy-research/"


###############################################################################
#                               Email Function
###############################################################################
def send_email(new_urls):
    """
    Sends an email with the count and list of new URLs found.
    """
    try:
        count = len(new_urls)
        subject = f"Web Scraper Update: {count} New URL{'s' if count > 1 else ''} Found"
        body = f"The following new URL{'s were' if count > 1 else ' was'} found:\n\n" + "\n".join(new_urls)

        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = EMAIL_RECIPIENT
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)
            print(f"[INFO] Email sent successfully to {EMAIL_RECIPIENT} with {count} new URL{'s' if count > 1 else ''}.")
    except Exception as e:
        print(f"[ERROR] Failed to send email: {e}")


###############################################################################
#                          Database / Schema Setup
###############################################################################

def create_unique_topics_table_if_not_exists(conn):
    """
    Creates the unique_topics table if it doesn't exist.
    This table holds each unique topic as a single row, so we can reference them.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS unique_topics (
        topic_id SERIAL PRIMARY KEY,
        topic TEXT UNIQUE NOT NULL
    );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
            conn.commit()
            print("[INFO] Table 'unique_topics' is ready.")
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to create table: {e}")
        conn.rollback()

def create_urls_table_if_not_exists(conn):
    """
    Creates the defensenews_urls table if it doesn't exist.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS defensenews_urls (
        defensenews_url_id SERIAL PRIMARY KEY,
        defensenews_url TEXT UNIQUE NOT NULL,
        defensenews_url_scraped_at TIMESTAMP NOT NULL,
        defensenews_url_state TEXT NOT NULL DEFAULT 'stale',
        datetime_stale TIMESTAMP DEFAULT NULL
    );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
            conn.commit()
            print("[INFO] Table 'defensenews_urls' is ready.")
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to create table: {e}")
        conn.rollback()

def create_urls_content_table_if_not_exists(conn):
    """
    Creates the urls_content table if it doesn't exist.
    """
    create_table_query = """
    CREATE TABLE IF NOT EXISTS urls_content (
        url_id SERIAL PRIMARY KEY,
        defensenews_url_id INTEGER NOT NULL REFERENCES defensenews_urls(defensenews_url_id),
        datetime_content_scrape TIMESTAMP,
        publication_date TIMESTAMP,
        title TEXT,
        description TEXT,
        topics_array TEXT[],
        author TEXT,
        topics TEXT,
        content TEXT,
        url TEXT,
        url_part_1 TEXT
    );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
            conn.commit()
            print("[INFO] Table 'urls_content' is ready.")
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to create table: {e}")
        conn.rollback()


###############################################################################
#                         Upsert into unique_topics
###############################################################################
def store_unique_topics(conn, topics_list):
    """
    Given a list of individual topic strings, insert them one by one into
    'unique_topics' if they don't already exist.
    """
    if not topics_list:
        return

    insert_query = """
    INSERT INTO unique_topics (topic)
    VALUES (%s)
    ON CONFLICT (topic) DO NOTHING;
    """
    try:
        with conn.cursor() as cur:
            for topic_str in topics_list:
                cleaned = topic_str.strip()
                if cleaned:
                    cur.execute(insert_query, (cleaned,))
            conn.commit()
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to store unique topics: {e}")
        conn.rollback()


###############################################################################
#                          Insert / Update Logic
###############################################################################
def insert_url(conn, url_with_timestamp, stats):
    """
    Inserts a new URL into defensenews_urls or updates its state to 'active'.
    Keeps track of new vs. updated in 'stats'.
    """
    insert_query = """
    INSERT INTO defensenews_urls (defensenews_url, defensenews_url_scraped_at, defensenews_url_state)
    VALUES (%s, %s, 'active')
    ON CONFLICT (defensenews_url)
    DO UPDATE SET defensenews_url_state = 'active',
                  defensenews_url_scraped_at = EXCLUDED.defensenews_url_scraped_at
    RETURNING (xmax = 0) AS is_new;
    """
    try:
        with conn.cursor() as cur:
            cur.execute(insert_query, url_with_timestamp)
            is_new = cur.fetchone()[0]  # True if inserted newly, False if updated
            conn.commit()
            
            if is_new:
                print(f"[INFO] New URL inserted: {url_with_timestamp[0]} at {url_with_timestamp[1]}")
                stats["new"] += 1
            else:
                stats["updated"] += 1
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to insert/update URL: {e}")
        conn.rollback()


###############################################################################
#                          Sitemap Functions
###############################################################################
def get_sitemap_urls(conn):
    """
    Fetches all sitemap URLs from the sitemap_urls table.
    """
    get_sitemaps_query = "SELECT sitemap_url FROM sitemap_urls;"
    try:
        with conn.cursor() as cur:
            cur.execute(get_sitemaps_query)
            sitemaps = cur.fetchall()
            print(f"[INFO] Retrieved {len(sitemaps)} sitemap URLs.")
            return [row[0] for row in sitemaps]
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Failed to get sitemaps: {e}")
        return []


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


def filter_urls(urls):
    """
    Remove URLs that contain '/video' or '/digital-show-dailies/'.
    """
    filtered_urls = [url for url in urls
                     if '/video' not in url and '/digital-show-dailies/' not in url]
    print(f"[INFO] Filtered out {len(urls) - len(filtered_urls)} unwanted URLs.")
    return filtered_urls


def get_new_urls(sitemap_maps):
    """
    Given a list of 'child sitemap' URLs, collect all <loc> tags.
    Return a set of (url, timestamp).
    """
    current_urls_with_timestamps = set()
    for map_url in sitemap_maps:
        urls = get_all_loc_elements(map_url)
        filtered = filter_urls(urls)
        timestamp = datetime.now()
        for u in filtered:
            current_urls_with_timestamps.add((u, timestamp))
    return current_urls_with_timestamps


###############################################################################
#                           Scraping Logic
###############################################################################
def extract_main_content(soup):
    """
    Extract main content from the HTML soup using body-paragraph classes.
    """
    paragraphs = soup.find_all("p", class_=re.compile(r"body-paragraph"))
    return "\n".join([p.get_text(strip=True) for p in paragraphs])

def scrape_url(conn, url):
    """
    Upserts content into urls_content for the given `url`.
    1) Find defensenews_url_id in defensenews_urls.
    2) Insert or update the row in urls_content.
    3) Actually scrape data from the page.
    4) Convert 'topics' to an array => store in topics_array => store in unique_topics.
    5) Fall back from og:description to <meta name="description"> if first is empty.
    6) Remove curly braces from the raw topics_str before storing
    """
    select_url_id_query = """
    SELECT defensenews_url_id
    FROM defensenews_urls
    WHERE defensenews_url = %s;
    """
    
    select_content_row_query = """
    SELECT url_id
    FROM urls_content
    WHERE defensenews_url_id = %s;
    """

    insert_content_query = """
    INSERT INTO urls_content (defensenews_url_id, url)
    VALUES (%s, %s)
    RETURNING url_id;
    """

    update_content_query = """
    UPDATE urls_content
    SET
      datetime_content_scrape = %s,
      publication_date = %s,
      title = %s,
      description = %s,
      topics_array = %s,
      author = %s,
      topics = %s,
      content = %s,
      url = %s,
      url_part_1 = %s
    WHERE url_id = %s;
    """

    try:
        with conn.cursor() as cur:
            # 1) See if there's a matching defensenews_url_id
            cur.execute(select_url_id_query, (url,))
            row = cur.fetchone()
            if not row:
                print(f"[ERROR] Could not find defensenews_url_id in defensenews_urls for URL: {url}")
                return

            defensenews_url_id = row[0]

            # 2) Insert or retrieve existing row in urls_content
            cur.execute(select_content_row_query, (defensenews_url_id,))
            existing_row = cur.fetchone()

            if not existing_row:
                cur.execute(insert_content_query, (defensenews_url_id, url))
                url_content_id = cur.fetchone()[0]
                conn.commit()
                print(f"[INFO] Created new row in urls_content for defensenews_url_id={defensenews_url_id}")
            else:
                url_content_id = existing_row[0]
                print(f"[INFO] Found existing row in urls_content (url_id={url_content_id}). Re-scraping to update.")

            # 3) Actually scrape
            print(f"[DEBUG] About to requests.get() => {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')

            # title
            title_meta = soup.find('meta', property='og:title')
            title = title_meta['content'].strip() if title_meta and title_meta.get('content') else "Title not found"

            # description => first try <meta property="og:description">
            desc_meta = soup.find('meta', property='og:description')
            description = desc_meta['content'].strip() if desc_meta and desc_meta.get('content') else ""

            # fallback => <meta name="description">
            if not description:
                fallback_desc = soup.find('meta', attrs={'name': 'description'})
                if fallback_desc and fallback_desc.get('content'):
                    description = fallback_desc['content'].strip()
                else:
                    description = None

            # publication_date via <meta property="article:published_time">
            pub_time_meta = soup.find('meta', property='article:published_time')
            pub_date_str = pub_time_meta['content'] if pub_time_meta and pub_time_meta.get('content') else None

            # Fallback to <meta itemprop="datePublished"> if empty
            if not pub_date_str:
                fallback_meta = soup.find('meta', attrs={'itemprop': 'datePublished', 'name': 'datePublished'})
                if fallback_meta and fallback_meta.get('content'):
                    pub_date_str = fallback_meta['content']

            publication_date = None
            if pub_date_str:
                try:
                    publication_date = parse_date(pub_date_str)
                except ValueError:
                    publication_date = None

            # author
            author_meta = soup.find('meta', attrs={'name': 'author'})
            author = author_meta['content'].strip() if author_meta and author_meta.get('content') else None

            # topics (keywords)
            keywords_meta = soup.find('meta', attrs={'name': 'keywords'})
            topics_str = keywords_meta['content'] if keywords_meta and keywords_meta.get('content') else ""
            topics_str = topics_str.strip()
            
            # remove curly braces from the raw topics string before storing in DB
            topics_str = topics_str.replace('{', '').replace('}', '')

            # create topics_array by splitting on comma
            if topics_str:
                topics_array = [t.strip() for t in topics_str.split(',') if t.strip()]
            else:
                topics_array = []

            # store these topics in the unique_topics table
            store_unique_topics(conn, topics_array)

            # content
            main_content = extract_main_content(soup)
            # remove any newlines
            main_content = main_content.replace('\n', ' ').strip()

            # parse out url_part_1 (or whichever segment you prefer)
            url_parts = url.split('/')
            # If user wants the 4th segment, do:
            url_part_1 = url_parts[3] if len(url_parts) > 3 else None

            # last scrape timestamp
            datetime_scraped = datetime.now()

            # 4) Update urls_content with everything
            cur.execute(update_content_query, (
                datetime_scraped,
                publication_date,
                title,
                description,
                topics_array,      # store array
                author,
                topics_str,        # store raw string
                main_content,
                url,               # store full URL
                url_part_1,
                url_content_id
            ))
            conn.commit()

            print(f"[INFO] Successfully scraped + stored content for URL: {url}")

    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch {url}: {e}")
        conn.rollback()
    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Database operation failed: {e}")
        conn.rollback()
    except Exception as e:
        print(f"[ERROR] Unexpected error scraping {url}: {e}")
        conn.rollback()


###############################################################################
#               Logic to Decide "Stale" vs. "Still Active"
###############################################################################
def check_url_live(url):
    """
    Returns True if the URL responds with a 2xx status code, False otherwise.
    We'll do HEAD first; if HEAD fails or returns non-2xx, we'll do a quick GET.
    """
    try:
        print(f"[DEBUG] Attempt HEAD: {url}")
        head_resp = requests.head(url, timeout=10, allow_redirects=True)
        print(f"[DEBUG] HEAD {url} -> {head_resp.status_code}")
        if 200 <= head_resp.status_code < 300:
            return True

        print(f"[DEBUG] Attempt GET: {url}")
        get_resp = requests.get(url, timeout=10, allow_redirects=True)
        print(f"[DEBUG] GET {url} -> {get_resp.status_code}")
        return 200 <= get_resp.status_code < 300

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Could not check URL {url}: {e}")
        return False


def check_and_mark_stale_urls(conn, current_urls):
    """
    For each URL in defensenews_urls that isn't in the current sitemap list,
    check if it's still live:
      - If 2xx, keep it active. Then see if we've scraped it. If not, scrape now.
      - If not 2xx, mark it stale.
    """
    current_set = set(current_urls)

    candidate_stale_query = """
    SELECT defensenews_url_id, defensenews_url
    FROM defensenews_urls
    WHERE defensenews_url_state != 'stale';
    """

    mark_stale_query = """
    UPDATE defensenews_urls
    SET defensenews_url_state = 'stale',
        datetime_stale = NOW()
    WHERE defensenews_url_id = %s;
    """

    reactivate_query = """
    UPDATE defensenews_urls
    SET defensenews_url_state = 'active',
        defensenews_url_scraped_at = NOW()
    WHERE defensenews_url_id = %s;
    """

    try:
        with conn.cursor() as cur:
            cur.execute(candidate_stale_query)
            rows = cur.fetchall()
            
            print(f"[DEBUG] check_and_mark_stale_urls() found {len(rows)} candidate URLs (non-stale).")

            for defensenews_url_id, url in rows:
                if url not in current_set:
                    # It's missing from the current sitemap
                    print(f"[DEBUG] Checking missing-from-sitemap => (ID: {defensenews_url_id}): {url}")
                    if check_url_live(url):
                        print(f"[INFO] URL {url} => STILL LIVE => reactivating + scraping.")
                        cur.execute(reactivate_query, (defensenews_url_id,))
                        conn.commit()

                        # Re-scrape it if needed
                        scrape_url(conn, url)
                    else:
                        print(f"[INFO] URL {url} => OFFLINE => marking stale.")
                        cur.execute(mark_stale_query, (defensenews_url_id,))
                        conn.commit()

    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Could not check or mark stale URLs: {e}")
        conn.rollback()


###############################################################################
#    Functions to Re-Scrape Articles with Missing or Blank Columns
###############################################################################
def scrape_missing_content(conn):
    """
    Finds all active URLs in defensenews_urls that have no entry in urls_content,
    and immediately scrapes them.
    """
    query = """
    SELECT du.defensenews_url_id, du.defensenews_url
    FROM defensenews_urls du
    LEFT JOIN urls_content uc ON du.defensenews_url_id = uc.defensenews_url_id
    WHERE du.defensenews_url_state = 'active'
      AND uc.url_id IS NULL;
    """
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            missing_rows = cur.fetchall()
            if not missing_rows:
                print("[INFO] No active URLs missing content rows. Nothing to scrape here.")
                return

            print(f"[INFO] Found {len(missing_rows)} active URLs with no content in 'urls_content'. Scraping them...")

            for defensenews_url_id, url in missing_rows:
                print(f"[DEBUG] Now scraping missing content for: {url} (ID={defensenews_url_id})")
                scrape_url(conn, url)

    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Could not scrape missing content: {e}")
        conn.rollback()


def scrape_incomplete_content(conn):
    """
    Re-scrape rows in urls_content that have blank columns for description, content, or title, etc.
    Adjust these conditions as needed.
    """
    query = """
    SELECT uc.url_id, du.defensenews_url
    FROM urls_content uc
    JOIN defensenews_urls du ON uc.defensenews_url_id = du.defensenews_url_id
    WHERE du.defensenews_url_state = 'active'
      AND (
           uc.title IS NULL OR uc.title = ''
        OR uc.description IS NULL OR uc.description = ''
        OR uc.content IS NULL OR uc.content = ''
      );
    """
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            incomplete_rows = cur.fetchall()
            if not incomplete_rows:
                print("[INFO] No rows with blank columns found.")
                return

            print(f"[INFO] Found {len(incomplete_rows)} rows with missing data. Re-scraping them...")
            for url_id, url in incomplete_rows:
                print(f"[DEBUG] Re-scraping incomplete row => url_id={url_id}, url={url}")
                scrape_url(conn, url)

    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Could not re-scrape incomplete content: {e}")
        conn.rollback()

###############################################################################
#  Re-run scrape on each website that has "https" in url_part_1
###############################################################################
def fix_url_part_1(conn):
    """
    Re-run scrape_url on each row in urls_content whose url_part_1 contains 'https'
    so that we replace url_part_1 with the newly scraped value.
    """
    query = """
    SELECT url_id, url 
    FROM urls_content
    WHERE url_part_1 ILIKE '%https%';
    """
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            if not rows:
                print("[INFO] No rows found where url_part_1 contains 'https'. Nothing to fix.")
                return

            print(f"[INFO] Found {len(rows)} rows with url_part_1 containing 'https'. Re-scraping them...")
            for url_id, full_url in rows:
                print(f"[DEBUG] Re-scraping row url_id={url_id}, url={full_url}")
                scrape_url(conn, full_url)

    except psycopg2.DatabaseError as e:
        print(f"[ERROR] Could not fix url_part_1: {e}")
        conn.rollback()


###############################################################################
#                                  Main Flow
###############################################################################
def main():
    conn = connect_db()
    if not conn:
        return

    # Create needed tables if they don't exist
    create_unique_topics_table_if_not_exists(conn)
    create_urls_table_if_not_exists(conn)
    create_urls_content_table_if_not_exists(conn)

    # 1. Fetch child sitemaps
    sitemap_urls = get_sitemap_urls(conn)
    
    # 2. Gather article URLs
    urls_with_timestamps = get_new_urls(sitemap_urls)

    # 3. Insert/update in defensenews_urls
    stats = {"new": 0, "updated": 0}
    new_urls = []
    for url_ts in urls_with_timestamps:
        insert_url(conn, url_ts, stats)
        if stats["new"] > len(new_urls):
            new_urls.append(url_ts[0])

    print(f"[INFO] {stats['new']} new URLs inserted.")
    print(f"[INFO] {stats['updated']} URLs were already present and updated.")

    # 4. Mark truly stale if they're missing from sitemap and offline
    current_urls = [u for (u, _) in urls_with_timestamps]
    check_and_mark_stale_urls(conn, current_urls)

    # 5. Scrape any active URL missing from urls_content
    scrape_missing_content(conn)

    # 6. Re-scrape rows that have blank columns for description, content, or title
    scrape_incomplete_content(conn)

    # 7. Finally, re-run scrape on each website that has "https" in url_part_1
    fix_url_part_1(conn)

    # 8. (Optional) - If you want to do a final check or printing of incomplete rows, do it here

    # 9. Send email if new URLs appeared
    if new_urls:
        print(f"[INFO] New URLs found:\n{new_urls}")
        send_email(new_urls)

    conn.close()


if __name__ == "__main__":
    main()
