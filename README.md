# RAG Application

A React-based RAG (Retrieval-Augmented Generation) application with a FastAPI backend for embeddings and vector search, powered by Ollama for local LLM inference.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/zoox101/RAG.git
cd RAG
```

### 2. Start the Backend Services

The application uses Docker Compose to run the required backend services (Ollama and vector store).

```bash
cd server
docker-compose up
```

This will start:
- **Ollama** service on port `11434` (for local LLM inference)
- **Vector Store** service on port `8000` (FastAPI embeddings server)

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

## Architecture & Design Decisions

This RAG implementation follows a three-stage pipeline for retrieval and generation: (1) user queries are converted to vector embeddings using the `nomic-embed-text` model via Ollama, (2) ChromaDB performs similarity search to retrieve relevant documents from the knowledge base, and (3) the retrieved context is combined with the user query and sent to the LLM for response generation. The backend architecture uses a microservices approach with dedicated containers for Ollama (LLM inference and embedding generation), FastAPI (ChromaDB operations and document retrieval), and React (user interactions and response streaming). The system uses template-based prompting to combine retrieved context with user queries, retrieves the most relevant documents based on vector similarity, and includes pre-computed embeddings for the Wikipedia dataset to optimize performance while maintaining local processing for privacy and cost control. 

## License

MIT License. See [LICENSE](LICENSE) file for details.

# Tradeoffs

## Feature-by-Feature Analysis

### **No Conversational History**

**✅ Pros:**
- **Reduces context**: Lower token usage and faster processing per request
- **Speeds up responses**: No need to process and include previous conversation history
- **Cleaner interactions**: Each question is treated independently, avoiding confusion from previous context
- **Memory efficient**: No need to store or manage conversation history in memory

**❌ Cons:**
- **No conversation continuity**: Cannot reference previous questions or build on earlier responses
- **Limited context awareness**: Cannot maintain context across multiple related questions
- **Repetitive explanations**: May need to repeat context that was established in previous messages
- **No follow-up questions**: Cannot ask clarifying questions based on previous responses


### **Local Processing & Privacy**

**✅ Pros:**
- **Complete data privacy**: All processing happens locally with Ollama and ChromaDB
- **No API costs**: No external API calls or usage fees
- **Offline capability**: Works without internet connection once models are downloaded
- **Customizable models**: Can use any model supported by Ollama

**❌ Cons:**
- **High resource requirements**: Ollama models require significant RAM (2-8GB+ depending on model)
- **Storage overhead**: Vector embeddings and model files consume substantial disk space
- **CPU/GPU intensive**: Local inference is slower than cloud APIs
- **Initial setup time**: Downloading models and generating embeddings takes time

### **RAG Implementation**

**✅ Pros:**
- **Context-aware responses**: Retrieves relevant documents before generating responses
- **Factual accuracy**: Reduces hallucination by grounding responses in retrieved context
- **Scalable knowledge base**: Can handle large document collections efficiently
- **Real-time search**: Vector similarity search provides fast document retrieval

**❌ Cons:**
- **Limited model selection**: Restricted to models available in Ollama ecosystem
- **Smaller context windows**: Local models typically have smaller context limits than cloud APIs
- **Inference speed**: Slower response generation compared to optimized cloud services
- **Model updates**: Manual process to update to newer model versions

### **Architecture & Scalability**

**✅ Pros:**
- **Docker containerization**: Easy setup and consistent environments
- **TypeScript frontend**: Type safety and better developer experience
- **Streaming responses**: Real-time response generation for better UX
- **Modular architecture**: Separate concerns between frontend, backend, and vector store

**❌ Cons:**
- **Single-user focused**: Not designed for concurrent multi-user access
- **Limited horizontal scaling**: Difficult to scale across multiple machines
- **No built-in authentication**: No user management or access controls
- **Fixed embedding model**: Uses `nomic-embed-text` which may not be optimal for all use cases

## When to Use This Application

**✅ Good For:**
- **Prototyping RAG systems**: Quick setup for testing RAG concepts
- **Privacy-sensitive applications**: When data cannot leave local infrastructure
- **Educational purposes**: Learning about RAG implementation and vector search
- **Personal knowledge management**: Private document search and Q&A
- **Offline environments**: Situations requiring disconnected operation

**❌ Not Suitable For:**
- **Production deployments**: Missing enterprise features like monitoring, auth, scaling
- **High-traffic applications**: Limited concurrent user support
- **Real-time data**: No automated data ingestion or updates
- **Multi-tenant systems**: No user isolation or access controls
- **Performance-critical applications**: Slower inference compared to cloud APIs

## Future Improvements

**Potential Enhancements:**
- **Multi-model support**: Allow switching between different LLM and embedding models
- **Real-time data ingestion**: Automated document processing and embedding updates
- **User authentication**: Basic user management and access controls
- **Performance optimization**: Model quantization, caching, and response optimization
- **Monitoring and logging**: Built-in metrics, error tracking, and performance monitoring
- **API endpoints**: RESTful API for integration with other applications
- **Data source connectors**: Support for databases, file systems, and web scraping
