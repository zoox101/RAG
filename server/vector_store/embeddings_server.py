# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import requests
import uuid
import pandas as pd
import os
from typing import List, Optional, Dict, Any

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in containerized environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = chromadb.PersistentClient(path="./LOCAL/chroma_db")  

# Create collection if it doesn't exist, otherwise get existing one
try:
    collection = client.get_collection("chunks")
except (ValueError, Exception):
    # In newer ChromaDB versions, NotFoundError is replaced with ValueError
    collection = client.create_collection("chunks")

class VectorQueryRequest(BaseModel):
    vector: list[float]
    n_results: int = 5

class DocumentAddRequest(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None

class DocumentDeleteRequest(BaseModel):
    ids: List[str]

def get_embedding(text: str, model='nomic-embed-text'):
    """Get embedding for text using Ollama"""
    # Get Ollama host and port from environment variables, with defaults
    ollama_host = os.getenv('OLLAMA_HOST', 'localhost')
    ollama_port = os.getenv('OLLAMA_PORT', '11434')
    
    url = f'http://{ollama_host}:{ollama_port}/api/embeddings'
    data = {
        "model": model,
        "prompt": text
    }
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()['embedding']

@app.post("/query_vector")
def query_vector(req: VectorQueryRequest):
    results = collection.query(query_embeddings=[req.vector], n_results=req.n_results)
    return results

@app.get("/collection/info")
def get_collection_info():
    """Get collection information"""
    try:
        count = collection.count()
        return {
            "name": "chunks",
            "count": count,
            "metadata": {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/collection/documents")
def get_collection_documents():
    """Get all documents in the collection"""
    try:
        # Get all documents (this might be slow for large collections)
        # In production, you'd want pagination
        results = collection.get()
        
        documents = []
        if results['documents']:
            for i, doc in enumerate(results['documents']):
                documents.append({
                    "id": results['ids'][i],
                    "content": doc,
                    "metadata": results['metadatas'][i] if results['metadatas'] else {}
                })
        
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collection/add")
def add_document(req: DocumentAddRequest):
    """Add a new document to the collection"""
    try:
        # Generate embedding for the document
        embedding = get_embedding(req.content)
        
        # Generate a unique ID
        doc_id = str(uuid.uuid4())
        
        # Add to collection
        collection.add(
            embeddings=[embedding],
            documents=[req.content],
            metadatas=[req.metadata or {}],
            ids=[doc_id]
        )
        
        return {"success": True, "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/collection/delete")
def delete_documents(req: DocumentDeleteRequest):
    """Delete documents by IDs"""
    try:
        collection.delete(ids=req.ids)
        return {"success": True, "deleted_count": len(req.ids)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/collection/clear")
def clear_collection():
    """Clear all documents from the collection"""
    try:
        # Get all document IDs first
        results = collection.get()
        deleted_count = 0
        if results['ids']:
            # Delete all documents by their IDs
            collection.delete(ids=results['ids'])
            deleted_count = len(results['ids'])
        
        return {
            "success": True, 
            "message": f"Collection cleared successfully. Deleted {deleted_count} documents."
        }
    except Exception as e:
        print(f"Error clearing collection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to clear collection: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        count = collection.count()
        return {
            "status": "healthy",
            "collection_name": "chunks",
            "document_count": count,
            "ollama_available": True  # We'll check this in a more robust way later
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/collection/load-dataset")
def load_dataset():
    """Load the Wikipedia dataset, generate embeddings, and add to collection"""
    try:
        # Ensure LOCAL directory exists
        os.makedirs("./LOCAL", exist_ok=True)
        
        
        # Step 1: Download dataset if not exists
        print("Downloading dataset...")
        df = pd.read_parquet("hf://datasets/rag-datasets/rag-mini-wikipedia/data/passages.parquet/part.0.parquet")

        
        # Step 2: Generate embeddings if not exists
        if not os.path.exists(PROCESSED_FNAME):
            print("Generating embeddings...")
            # Generate embeddings for all passages
            embeddings = []
            total_passages = len(df)
            
            for i, passage in enumerate(df['passage']):
                try:
                    embedding = get_embedding(passage)
                    embeddings.append(embedding)
                    
                    # Progress update every 100 passages
                    if (i + 1) % 100 == 0:
                        print(f"Processed {i + 1}/{total_passages} passages")
                        
                except Exception as e:
                    print(f"Error generating embedding for passage {i}: {str(e)}")
                    # Use a zero vector as fallback
                    embeddings.append([0.0] * 768)  # Assuming 768-dimensional embeddings
            
            df['embedding'] = embeddings
            df.to_parquet(PROCESSED_FNAME)
            print("Embeddings generated and saved")
        else:
            print("Loading existing embeddings...")
            df = pd.read_parquet(PROCESSED_FNAME)
        
        # Step 3: Clear existing collection and add new documents
        print("Clearing existing collection...")
        results = collection.get()
        if results['ids']:
            collection.delete(ids=results['ids'])
        
        print("Adding documents to collection...")
        # Add vectors to collection
        collection.add(
            embeddings=df["embedding"].to_list(),
            documents=df["passage"].to_list(),
            ids=[str(val) for val in df.index]
        )
        
        print(f"Successfully added {len(df)} documents to collection")
        
        return {
            "success": True,
            "message": f"Dataset loaded successfully! Added {len(df)} documents to the collection.",
            "documents_added": len(df),
            "dataset_shape": df.shape
        }
        
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to load dataset: {str(e)}")