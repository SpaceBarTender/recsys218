# Use an official Python runtime as a base image.
FROM python:3.10-slim

# Set the working directory in the container.
WORKDIR /app

# Copy the requirements file into the container.
COPY requirements.txt .

# Install any needed packages specified in requirements.txt.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the scraper code into the container.
COPY . .

# Set the orchestrator as the default command.
CMD ["python", "_orchestrator_incremental.py"]
