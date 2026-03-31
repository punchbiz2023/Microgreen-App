FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including libGL for OpenCV)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements first (for layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY ./app ./app

# Copy the entire ml_engine directory (prediction + counting models)
COPY ../ml_engine ./ml_engine

# Copy shared data directory (contains trained prediction models)
COPY ../data ./data

# Create static upload directories
RUN mkdir -p /app/static/photos /app/static/count_results

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
