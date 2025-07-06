#!/bin/bash

# Start the FastAPI embeddings server
echo "Starting FastAPI embeddings server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Activate virtual environment
source .venv/bin/activate

# Use the Python executable from the virtual environment
.venv/bin/python -m uvicorn python.embeddings_server:app --host 0.0.0.0 --port 8000 --reload 