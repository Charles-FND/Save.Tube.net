FROM python:3.10-slim

# Install system dependencies, including ffmpeg for yt-dlp merging
RUN apt-get update && apt-get install -y ffmpeg nodejs && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Railway / Render both inject $PORT at runtime
EXPOSE 8080

# Start Gunicorn – bind to $PORT so Railway works automatically
CMD gunicorn savetube.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 2 --timeout 120
