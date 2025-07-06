import { useState, useEffect, useRef } from 'react';
import { Message } from './Chat';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3.2';

export const useOllamaChat = () => {
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
            setIsLoading(true);
            (async () => {
                try {
                    // Add a placeholder Friend message for streaming
                    setMessages(prev => [
                        ...prev,
                        { text: '', sender: 'Friend' }
                    ]);
                    const res = await fetch(OLLAMA_API_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: OLLAMA_MODEL, prompt }),
                    });
                    if (!res.ok) throw new Error('Network response was not ok');
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
                    lastRespondedIndex.current = lastUserIndex;
                } catch (err) {
                    setMessages(prev => [
                        ...prev,
                        { text: 'Error getting response from Ollama.', sender: 'Friend' }
                    ]);
                    lastRespondedIndex.current = lastUserIndex;
                } finally {
                    setIsLoading(false);
                }
            })();
        }
    }, [messages, isLoading]);

    return {
        messages,
        setMessages,
        isLoading
    };
}; 