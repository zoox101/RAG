#!/bin/bash

# RAG Application Startup Script
# This script starts all required servers for the RAG application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within expected time"
    return 1
}

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down servers..."
    if [ ! -z "$OLLAMA_PID" ]; then
        kill $OLLAMA_PID 2>/dev/null || true
        print_status "Ollama server stopped"
    fi
    if [ ! -z "$FASTAPI_PID" ]; then
        kill $FASTAPI_PID 2>/dev/null || true
        print_status "FastAPI server stopped"
    fi
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null || true
        print_status "Vite server stopped"
    fi
    exit 0
}

# Set up signal handlers for cleanup
trap cleanup SIGINT SIGTERM

print_status "Starting RAG Application Servers..."
echo ""

# Check if required tools are installed
print_status "Checking prerequisites..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    print_error "Ollama is not installed. Please install Ollama first:"
    print_error "Visit: https://ollama.ai/download"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    print_error "Virtual environment not found. Please create it first:"
    print_error "python3 -m venv .venv"
    print_error "source .venv/bin/activate"
    print_error "pip install -r requirements.txt"
    exit 1
fi

print_success "All prerequisites are installed"
echo ""

# Check if required models are available
print_status "Checking Ollama models..."

# Check for llama3.2 model
if ! ollama list | grep -q "llama3.2"; then
    print_warning "llama3.2 model not found. Pulling it now..."
    ollama pull llama3.2
fi

# Check for nomic-embed-text model
if ! ollama list | grep -q "nomic-embed-text"; then
    print_warning "nomic-embed-text model not found. Pulling it now..."
    ollama pull nomic-embed-text
fi

print_success "All required models are available"
echo ""

# Check if ChromaDB exists
if [ ! -d "./python/LOCAL/chroma_db" ]; then
    print_warning "ChromaDB not found. You may need to run the database creation script first:"
    print_warning "Run: ./run_create_chroma_db.sh"
    echo ""
fi

# Start Ollama server (if not already running)
print_status "Starting Ollama server..."
if check_port 11434; then
    print_warning "Ollama server is already running on port 11434"
else
    print_status "Starting Ollama server on port 11434..."
    ollama serve &
    OLLAMA_PID=$!
    sleep 3  # Give Ollama time to start
fi

# Wait for Ollama to be ready
if wait_for_service "http://localhost:11434/api/tags" "Ollama server"; then
    print_success "Ollama server is running at http://localhost:11434"
else
    print_error "Failed to start Ollama server"
    exit 1
fi
echo ""

# Start FastAPI embeddings server
print_status "Starting FastAPI embeddings server..."
if check_port 8000; then
    print_warning "FastAPI server is already running on port 8000"
else
    print_status "Starting FastAPI server on port 8000..."
    cd python
    source ../.venv/bin/activate
    ../.venv/bin/python -m uvicorn embeddings_server:app --host 0.0.0.0 --port 8000 --reload &
    FASTAPI_PID=$!
    cd ..
    sleep 3  # Give FastAPI time to start
fi

# Wait for FastAPI to be ready
if wait_for_service "http://localhost:8000/docs" "FastAPI server"; then
    print_success "FastAPI server is running at http://localhost:8000"
else
    print_error "Failed to start FastAPI server"
    exit 1
fi
echo ""

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"
    echo ""
fi

# Start Vite dev server
print_status "Starting Vite development server..."
if check_port 5173; then
    print_warning "Vite server is already running on port 5173"
else
    print_status "Starting Vite server on port 5173..."
    npm run dev &
    VITE_PID=$!
    sleep 3  # Give Vite time to start
fi

# Wait for Vite to be ready
if wait_for_service "http://localhost:5173" "Vite server"; then
    print_success "Vite server is running at http://localhost:5173"
else
    print_error "Failed to start Vite server"
    exit 1
fi
echo ""

# Final status
print_success "All servers are running!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:     http://localhost:5173"
echo "   FastAPI:      http://localhost:8000"
echo "   Ollama:       http://localhost:11434"
echo ""
echo "📚 API Documentation:"
echo "   FastAPI Docs: http://localhost:8000/docs"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo ""

# Keep the script running and monitor processes
while true; do
    # Check if any of our processes are still running
    if [ ! -z "$OLLAMA_PID" ] && ! kill -0 $OLLAMA_PID 2>/dev/null; then
        print_error "Ollama server stopped unexpectedly"
        cleanup
    fi
    
    if [ ! -z "$FASTAPI_PID" ] && ! kill -0 $FASTAPI_PID 2>/dev/null; then
        print_error "FastAPI server stopped unexpectedly"
        cleanup
    fi
    
    if [ ! -z "$VITE_PID" ] && ! kill -0 $VITE_PID 2>/dev/null; then
        print_error "Vite server stopped unexpectedly"
        cleanup
    fi
    
    sleep 5
done 