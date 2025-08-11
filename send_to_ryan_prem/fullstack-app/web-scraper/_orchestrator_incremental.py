import subprocess
from db_utils import connect_db


SITEMAP_SCRIPT = "1_get_sitemap.py"
BEST_2_SCRIPT = "scrape_url_content.py"
# BEST_3_SCRIPT = "vectorize_url_content.py"

# List of scripts to execute in order
scripts = [SITEMAP_SCRIPT, BEST_2_SCRIPT] #BEST_3_SCRIPT

def run_script(script_name):
    try:
        print(f"Running {script_name}...")
        # Use subprocess.run without capturing output to stream it directly
        subprocess.run(["python", script_name], check=True)
        print(f"{script_name} completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while running {script_name}: {e}")
        exit(1)

def main():
    for script in scripts:
        run_script(script)
    print("All scripts executed successfully.")

if __name__ == "__main__":
    main()
