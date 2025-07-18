#!/bin/bash

# Crop Classifier Backend Startup Script
echo "🌱 Starting Crop Classifier Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Error: Python $PYTHON_VERSION is installed, but Python $REQUIRED_VERSION or higher is required."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION detected"

# Navigate to backend directory
cd "$(dirname "$0")"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to create virtual environment."
        exit 1
    fi
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing requirements..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Error: Failed to install requirements."
        exit 1
    fi
    echo "✅ Requirements installed successfully"
else
    echo "❌ Error: requirements.txt not found."
    exit 1
fi

# Check if main.py exists
if [ ! -f "api/main.py" ]; then
    echo "❌ Error: api/main.py not found."
    exit 1
fi

# Set environment variables if .env exists
if [ -f ".env" ]; then
    echo "🔧 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Start the application
echo "🚀 Starting Crop Classifier API server..."
echo "📍 Server will be available at: http://localhost:5003"
echo "📊 API documentation will be available at: http://localhost:5003/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="

# Run the FastAPI application with uvicorn
cd api
python -m uvicorn main:app --host 0.0.0.0 --port 5003 --reload

# Deactivate virtual environment when done
deactivate