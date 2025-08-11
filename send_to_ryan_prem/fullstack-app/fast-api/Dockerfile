# Use Python 3.9 as the base image
FROM python:3.10-slim

# Set working directory in the container
WORKDIR /app

# Install system dependencies required for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port 8000 (FastAPI default port)
EXPOSE 5000

# Command to run the application using uvicorn
CMD ["sh", "-c", "uvicorn fast_api_app:app --host 0.0.0.0 --port 5000 ${UVICORN_RELOAD:+'--reload'}"]
