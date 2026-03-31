FROM python:3.11-slim

WORKDIR /app

# Install only essential system dependencies (PostgreSQL client and build tools)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for headless OpenCV and ML libraries
ENV PYTHONUNBUFFERED=1
ENV OPENBLAS_NUM_THREADS=1
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

# Copy and install Python requirements first (for layer caching)
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code
COPY backend/app ./app

# Copy the entire ml_engine directory (prediction + counting models)
# Using ./ml_engine because the build context is the repository root
COPY ./ml_engine ./ml_engine

# Copy shared data directory (contains trained prediction models)
COPY ./data ./data

# Create static upload directories
RUN mkdir -p /app/static/photos /app/static/count_results

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
