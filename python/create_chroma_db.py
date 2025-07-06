import os
import pandas as pd
import requests
from tqdm import tqdm
import chromadb

RAW_PARQUET = "./LOCAL/raw.parquet"
PROCESSED_PARQUET = "./LOCAL/processed.parquet"
CHROMA_DB_PATH = "./LOCAL/chroma_db"
COLLECTION_NAME = "chunks"
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
OLLAMA_EMBED_MODEL = "nomic-embed-text"

# Ensure python/LOCAL directory exists
os.makedirs("./LOCAL", exist_ok=True)

# 1. Load or download the data
def load_data():
    if os.path.exists(RAW_PARQUET):
        df = pd.read_parquet(RAW_PARQUET)
    else:
        print("File not found, downloading...")
        df = pd.read_parquet("hf://datasets/rag-datasets/rag-mini-wikipedia/data/passages.parquet/part.0.parquet")
        os.makedirs(os.path.dirname(RAW_PARQUET), exist_ok=True)
        df.to_parquet(RAW_PARQUET)
    print(f"Loaded data: {df.shape}")
    return df

# 2. Generate embeddings using Ollama
def get_embedding(text, model=OLLAMA_EMBED_MODEL):
    url = OLLAMA_EMBED_URL
    data = {"model": model, "prompt": text}
    response = requests.post(url, json=data)
    response.raise_for_status()
    return response.json()['embedding']

def add_embeddings(df):
    tqdm.pandas(desc="Embedding passages")
    df['embedding'] = df['passage'].progress_apply(lambda x: get_embedding(x))
    return df

# 3. Save processed data
def save_processed(df):
    os.makedirs(os.path.dirname(PROCESSED_PARQUET), exist_ok=True)
    df.to_parquet(PROCESSED_PARQUET)
    print(f"Saved processed data to {PROCESSED_PARQUET}")

# 4. Populate Chroma DB
def populate_chroma(df):
    print(f"Populating Chroma DB at {CHROMA_DB_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    if COLLECTION_NAME in [c.name for c in client.list_collections()]:
        print(f"Collection '{COLLECTION_NAME}' already exists. Deleting and recreating.")
        client.delete_collection(COLLECTION_NAME)
    collection = client.create_collection(COLLECTION_NAME)
    collection.add(
        embeddings=df["embedding"].to_list(),
        documents=df["passage"].to_list(),
        ids=[str(val) for val in df.index]
    )
    print(f"Added {len(df)} documents to Chroma DB.")

if __name__ == "__main__":
    # Ensure python/LOCAL directory exists before any file operations
    os.makedirs("./LOCAL", exist_ok=True)
    df = load_data()
    if os.path.exists(PROCESSED_PARQUET):
        print("Loading processed data with embeddings...")
        df = pd.read_parquet(PROCESSED_PARQUET)
    else:
        print("Generating embeddings for passages...")
        df = add_embeddings(df)
        save_processed(df)
    populate_chroma(df)
    print("✅ Chroma DB creation and population complete!") 