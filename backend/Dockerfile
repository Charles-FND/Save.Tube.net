FROM python:3.10-slim

# Install system dependencies, including ffmpeg for yt-dlp merging
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Expose port (Render uses $PORT environment variable, default 10000)
EXPOSE 10000

# Start Gunicorn server
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:10000"]
