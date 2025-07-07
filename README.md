# RAG Application

A React-based RAG (Retrieval-Augmented Generation) application with a FastAPI backend for embeddings and vector search, powered by Ollama for local LLM inference.

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd RAG
```

### 2. Start the Backend Services

The application uses Docker Compose to run the required backend services (Ollama and vector store).

```bash
cd server
docker-compose up -d
```

This will start:
- **Ollama** service on port `11434` (for local LLM inference)
- **Vector Store** service on port `8000` (FastAPI embeddings server)

You can monitor the services with:
```bash
docker-compose logs -f
```

### 3. Install Frontend Dependencies

```bash
# From the project root
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The React application will be available at `http://localhost:5173` (or the next available port).

## License

MIT License. See [LICENSE](LICENSE) file for details.
