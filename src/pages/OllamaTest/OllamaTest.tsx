import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3.2'; // Updated to llama3.2

const OllamaTest: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResponse('');
        try {
            const res = await fetch(OLLAMA_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: OLLAMA_MODEL, prompt }),
            });
            if (!res.ok) throw new Error('Network response was not ok');
            // Ollama streams responses line by line, so we need to read the stream
            const reader = res.body?.getReader();
            let result = '';
            if (reader) {
                const decoder = new TextDecoder();
                let done = false;
                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        const chunk = decoder.decode(value, { stream: !done });
                        // Each chunk is a JSON line
                        chunk.split('\n').forEach(line => {
                            if (line.trim()) {
                                try {
                                    const json = JSON.parse(line);
                                    if (json.response) result += json.response;
                                } catch {}
                            }
                        });
                        setResponse(result);
                    }
                }
            }
        } catch (err: any) {
            setError('Error getting response from Ollama.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#f7f7f7', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
            <h2>Ollama Test Page</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                    type="text"
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Enter your prompt..."
                    style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !prompt.trim()} style={{ padding: '0 20px', borderRadius: 6, border: 'none', background: '#007aff', color: 'white', fontWeight: 600, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer', height: 40 }}>
                    {isLoading ? 'Loading...' : 'Send'}
                </button>
            </form>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            {response && (
                <div style={{ background: '#fff', padding: 16, borderRadius: 8, minHeight: 40, fontSize: 16, color: '#222', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <ReactMarkdown>{response}</ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default OllamaTest; 