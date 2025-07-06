import React, { useState } from 'react';

const OLLAMA_EMBED_URL = 'http://localhost:11434/api/embeddings';
const CHROMA_QUERY_URL = 'http://localhost:8000/query_vector';
const OLLAMA_MODEL = 'nomic-embed-text'; // or your preferred embedding model

const VectorSearch: React.FC = () => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResults(null);
        try {
            // 1. Get embedding from Ollama
            const embedRes = await fetch(OLLAMA_EMBED_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: OLLAMA_MODEL, prompt: input }),
            });
            if (!embedRes.ok) throw new Error('Failed to get embedding from Ollama');
            const embedData = await embedRes.json();
            const vector = embedData.embedding;

            // 2. Query Chroma server
            const chromaRes = await fetch(CHROMA_QUERY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vector, n_results: 5 }),
            });
            if (!chromaRes.ok) throw new Error('Failed to query Chroma server');
            const chromaData = await chromaRes.json();
            setResults(chromaData);
        } catch (err: any) {
            setError(err.message || 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#f7f7f7', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h2>Vector Search</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Enter your query..."
                    style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} style={{ padding: '0 20px', borderRadius: 6, border: 'none', background: '#007aff', color: 'white', fontWeight: 600, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer', height: 40 }}>
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </form>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            {results && (
                <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 40, fontSize: 16, color: '#222', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h3>Results</h3>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(results, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default VectorSearch; 