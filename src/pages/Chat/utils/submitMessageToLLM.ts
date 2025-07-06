// LLM message submission logic

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'llama3.2';

export interface MessageSubmissionResult {
    success: boolean;
    result?: string;
    error?: string;
}

/**
 * Submits a prompt to the LLM and returns the streaming response
 * 
 * @param prompt - The prompt to send to the LLM
 * @param onStreamUpdate - Callback function called with each streaming update
 * @returns Promise that resolves to a MessageSubmissionResult
 */
export const submitMessageToLLM = async (
    prompt: string,
    onStreamUpdate: (text: string) => void
): Promise<MessageSubmissionResult> => {

    console.log('📤 Sending to model:', prompt);

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