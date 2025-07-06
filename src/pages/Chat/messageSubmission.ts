// Shared message submission logic for chat and RAG

export interface Message {
    text: string;
    sender: string;
}

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3.2';

export interface MessageSubmissionResult {
    success: boolean;
    result?: string;
    error?: string;
}

/**
 * Submits a prompt to the LLM and returns the streaming response
 */
export const submitMessageToLLM = async (
    prompt: string,
    onStreamUpdate: (text: string) => void
): Promise<MessageSubmissionResult> => {
    try {
        console.log('🤖 Generating response with LLM...');
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
                                    onStreamUpdate(result);
                                }
                            } catch {}
                        }
                    });
                }
            }
        }
        
        console.log('✅ Message submission completed successfully!');
        console.log('💬 Final response:', result);
        
        return {
            success: true,
            result
        };
    } catch (error) {
        console.error('❌ Error in message submission:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Creates a placeholder message for streaming updates
 */
export const createPlaceholderMessage = (setMessages: React.Dispatch<React.SetStateAction<Message[]>>): void => {
    setMessages(prev => [
        ...prev,
        { text: '', sender: 'Friend' }
    ]);
};

/**
 * Updates the last Friend message with streaming text
 */
export const updateLastFriendMessage = (
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    text: string
): void => {
    setMessages(prev => {
        const updated = [...prev];
        // Find the last Friend message (should be the one we just added)
        for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].sender === 'Friend') {
                updated[i] = { ...updated[i], text };
                break;
            }
        }
        return updated;
    });
};

/**
 * Adds an error message to the chat
 */
export const addErrorMessage = (
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    errorMessage: string
): void => {
    setMessages(prev => [
        ...prev,
        { text: errorMessage, sender: 'Friend' }
    ]);
}; 