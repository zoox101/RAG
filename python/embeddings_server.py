# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb

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

@app.post("/query_vector")
def query_vector(req: VectorQueryRequest):
    results = collection.query(query_embeddings=[req.vector], n_results=req.n_results)
    return results