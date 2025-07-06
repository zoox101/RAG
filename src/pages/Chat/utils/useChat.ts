import { useState, useEffect } from 'react';
import { submitMessageToLLM } from './submitMessageToLLM';
import getPrompt from './getPrompt';

// Message interface
export interface Message {
    text: string;
    sender: string;
}

/**
 * Custom hook that manages chat functionality for both RAG and regular chat modes
 * 
 * This hook handles:
 * - Message state management
 * - Automatic response generation when user messages are added
 * - Switching between RAG mode (with context retrieval) and regular chat mode
 * - Loading states and error handling
 * - Streaming responses from the LLM
 * 
 * @param useRagMode - Boolean flag to determine if RAG mode is enabled (default: true)
 * @returns Object containing messages, setMessages function, and loading state
 */
export const useChat = (useRagMode: boolean = true) => {
    // State for storing chat messages
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Loading state to prevent multiple simultaneous requests
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Creates a placeholder message for streaming updates
     */
    const createPlaceholderMessage = (): void => {
        setMessages(prev => [
            ...prev,
            { text: '', sender: 'Friend' }
        ]);
    };

    /**
     * Updates the last Friend message with streaming text
     */
    const updateLastFriendMessage = (text: string): void => {
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
    const addErrorMessage = (errorMessage: string): void => {
        setMessages(prev => [
            ...prev,
            { text: errorMessage, sender: 'Friend' }
        ]);
    };

    useEffect(() => {
        // Don't process if already loading a response
        if (isLoading) return;

        // Return if the there is no last message or the last message is not a user message
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.sender !== "You") {
            return;
        }
        
        // Set loading state to prevent duplicate requests
        setIsLoading(true);
        
        // Async function to handle the response generation
        (async () => {
            // Create a placeholder message that will be updated with streaming content
            createPlaceholderMessage();

            // Determine the system type for logging and error messages
            const systemType = useRagMode ? 'RAG' : 'Chat';
            console.log(`🚀 Starting ${systemType} process for query:`, lastMessage.text);

            // Getting the prompt and submitting it to the LLM
            const finalPrompt = await getPrompt(messages, useRagMode);            
            const result = await submitMessageToLLM(
                finalPrompt,
                (text: string) => updateLastFriendMessage(text)
            );

            // Handle any errors from the LLM response
            if (!result.success) {
                const errorMessage = `Error getting response from ${systemType} system.` 
                addErrorMessage(errorMessage);
            }

            console.log(`✅ ${systemType} process completed successfully!`);
            
            // Clear loading state
            setIsLoading(false);
            console.log('🏁 Chat process finished');
        })();
    }, [messages, isLoading, useRagMode]);

    return {
        messages,
        setMessages,
        isLoading
    };
}; 