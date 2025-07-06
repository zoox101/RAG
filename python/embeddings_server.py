# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
import requests
import uuid
from typing import List, Optional, Dict, Any

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = chromadb.PersistentClient(path="./python/LOCAL/chroma_db")  
collection = client.get_collection("chunks")

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
    url = 'http://localhost:11434/api/embeddings'
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