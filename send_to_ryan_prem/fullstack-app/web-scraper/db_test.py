from db_utils import connect_db
import psycopg2

conn = connect_db()
if conn:
	print("Good!")
else:
	print("Bad")
