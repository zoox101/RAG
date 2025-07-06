import { useState, useEffect, useRef } from 'react';

export interface Message {
    text: string;
    sender: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_EMBED_URL = 'http://localhost:11434/api/embeddings';
const CHROMA_QUERY_URL = 'http://localhost:8000/query_vector';
const OLLAMA_MODEL = 'llama3.2';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text';

export const useUnifiedChat = (useRag: boolean = true) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const lastRespondedIndex = useRef<number>(messages.length - 1);

    useEffect(() => {
        if (isLoading) return;
        let lastUserIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'You') {
                lastUserIndex = i;
                break;
            }
        }
        if (
            lastUserIndex !== -1 &&
            (messages.length === lastUserIndex + 1 || messages[lastUserIndex + 1].sender !== 'Friend') &&
            lastRespondedIndex.current !== lastUserIndex
        ) {
            const prompt = messages[lastUserIndex].text;
            
            if (useRag) {
                console.log('🚀 Starting RAG process for query:', prompt);
            } else {
                console.log('💬 Starting regular chat for query:', prompt);
            }
            
            setIsLoading(true);
            (async () => {
                try {
                    // Add a placeholder Friend message for streaming
                    setMessages(prev => [
                        ...prev,
                        { text: '', sender: 'Friend' }
                    ]);

                    let finalPrompt = prompt;

                    if (useRag) {
                        // Step 1: Get embedding for the user's query
                        console.log('📊 Step 1: Getting embedding for query...');
                        const embedRes = await fetch(OLLAMA_EMBED_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt }),
                        });
                        if (!embedRes.ok) throw new Error('Failed to get embedding from Ollama');
                        const embedData = await embedRes.json();
                        const vector = embedData.embedding;
                        console.log('✅ Embedding generated successfully. Vector length:', vector.length);

                        // Step 2: Query Chroma server for relevant documents
                        console.log('🔍 Step 2: Querying Chroma DB for relevant documents...');
                        const chromaRes = await fetch(CHROMA_QUERY_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ vector, n_results: 3 }),
                        });
                        if (!chromaRes.ok) throw new Error('Failed to query Chroma server');
                        const chromaData = await chromaRes.json();
                        console.log('📚 Chroma query results:', chromaData);

                        // Step 3: Create enhanced prompt with retrieved context
                        console.log('📝 Step 3: Creating enhanced prompt with context...');
                        let context = '';
                        if (chromaData.documents && chromaData.documents[0]) {
                            context = '\n\nRelevant context:\n' + chromaData.documents[0].join('\n\n');
                            console.log('📄 Retrieved context:', context);
                        } else {
                            console.log('⚠️ No relevant documents found in Chroma DB');
                        }

                        finalPrompt = `You are a helpful assistant. Use the following context to answer the user's question. If the context doesn't contain relevant information, you can use your general knowledge.

Context:${context}

User question: ${prompt}

Please provide a helpful and accurate response based on the context provided.`;

                        console.log('🎯 Enhanced prompt created:', finalPrompt);
                    }

                    // Step 4: Generate response with prompt
                    console.log('🤖 Step 4: Generating response with LLM...');
                    const res = await fetch(OLLAMA_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: OLLAMA_MODEL, prompt: finalPrompt }),
                    });
                    if (!res.ok) throw new Error('Network response was not ok');
                    const reader = res.body?.getReader();
                    let result = '';
                    if (reader) {
                        const decoder = new TextDecoder();
                        let done = false;
                        console.log('📡 Starting response streaming...');
                        while (!done) {
                            const { value, done: doneReading } = await reader.read();
                            done = doneReading;
                            if (value) {
                                const chunk = decoder.decode(value, { stream: !done });
                                chunk.split('\n').forEach(line => {
                                    if (line.trim()) {
                                        try {
                                            const json = JSON.parse(line);
                                            if (json.response) {
                                                result += json.response;
                                                setMessages(prev => {
                                                    // Update the last Friend message with the streamed text
                                                    const updated = [...prev];
                                                    // Find the last Friend message (should be the one we just added)
                                                    for (let i = updated.length - 1; i >= 0; i--) {
                                                        if (updated[i].sender === 'Friend') {
                                                            updated[i] = { ...updated[i], text: result };
                                                            break;
                                                        }
                                                    }
                                                    return updated;
                                                });
                                            }
                                        } catch {}
                                    }
                                });
                            }
                        }
                    }
                    
                    if (useRag) {
                        console.log('✅ RAG process completed successfully!');
                    } else {
                        console.log('✅ Regular chat completed successfully!');
                    }
                    console.log('💬 Final response:', result);
                    lastRespondedIndex.current = lastUserIndex;
                } catch (err) {
                    console.error('❌ Error in chat process:', err);
                    const errorMessage = useRag 
                        ? 'Error getting response from RAG system.' 
                        : 'Error getting response from Ollama.';
                    setMessages(prev => [
                        ...prev,
                        { text: errorMessage, sender: 'Friend' }
                    ]);
                    lastRespondedIndex.current = lastUserIndex;
                } finally {
                    setIsLoading(false);
                    console.log('🏁 Chat process finished');
                }
            })();
        }
    }, [messages, isLoading, useRag]);

    return {
        messages,
        setMessages,
        isLoading
    };
}; 