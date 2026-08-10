#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing FFmpeg..."
# Download a static build of ffmpeg
wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
tar xvf ffmpeg-release-amd64-static.tar.xz
# Move ffmpeg and ffprobe to a directory in PATH, or just the project root
mv ffmpeg-*-amd64-static/ffmpeg backend/
mv ffmpeg-*-amd64-static/ffprobe backend/
rm -rf ffmpeg-*-amd64-static*

echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt

echo "Running Django migrations..."
python manage.py migrate
