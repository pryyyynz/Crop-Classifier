#!/bin/bash

# Simple Crop Classifier Backend Startup Script
echo "🌱 Starting Crop Classifier Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Install requirements
echo "📥 Installing requirements..."
pip install -r requirements.txt

# Start the application
echo "🚀 Starting server at http://localhost:5003"
cd api
python main.py