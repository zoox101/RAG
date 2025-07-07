# init_vectorstore.py
import chromadb
import pandas as pd
import os
import numpy as np

def init_vectorstore():
    """Initialize the ChromaDB vector store with processed data."""
    try:
        client = chromadb.PersistentClient(path="./LOCAL/chroma_db")  

        # Create collection if it doesn't exist, otherwise get existing one
        try:
            collection = client.get_collection("chunks")
            print("Found existing 'chunks' collection")
        except Exception:
            collection = client.create_collection("chunks")
            print("Created new 'chunks' collection")

        df = pd.read_parquet("processed.parquet")
        print(f"Loaded {len(df)} documents from processed.parquet")
        
        # Clear existing collection and add new documents
        print("Clearing existing collection...")
        results = collection.get()
        if results['ids']:
            collection.delete(ids=results['ids'])
            print(f"Deleted {len(results['ids'])} existing documents")
        
        print("Adding documents to collection...")
        # Convert numpy arrays to Python lists and add vectors to collection
        embeddings = [emb.tolist() if isinstance(emb, np.ndarray) else emb for emb in df["embedding"].to_list()]
        collection.add(
            embeddings=embeddings,
            documents=df["passage"].to_list(),
            ids=[str(val) for val in df.index]
        )
        
        print(f"Successfully added {len(df)} documents to collection")
        return True
        
    except Exception as e:
        print(f"Error initializing vector store: {str(e)}")
        return False

if __name__ == "__main__":
    success = init_vectorstore()
    if success:
        print("Vector store initialization completed successfully!")
    else:
        print("Vector store initialization failed!")
        exit(1)