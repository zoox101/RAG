import { useState, useEffect, useRef } from 'react';
import { 
    submitMessageToLLM, 
    createPlaceholderMessage, 
    updateLastFriendMessage, 
    addErrorMessage,
    Message 
} from './messageSubmission';
import getPrompt from './getPrompt';

/**
 * Custom hook that manages unified chat functionality for both RAG and regular chat modes
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
export const useUnifiedChat = (useRagMode: boolean = true) => {
    // State for storing chat messages
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Loading state to prevent multiple simultaneous requests
    const [isLoading, setIsLoading] = useState(false);
    
    // Ref to track the last message index we've responded to (prevents duplicate responses)
    const lastRespondedIndex = useRef<number>(messages.length - 1);

    useEffect(() => {
        // Don't process if already loading a response
        if (isLoading) return;
        
        // Find the most recent user message that hasn't been responded to yet
        let lastUserIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender === 'You') {
                lastUserIndex = i;
                break;
            }
        }
        
        // Check if we need to generate a response:
        // 1. We found a user message (lastUserIndex !== -1)
        // 2. Either there are no messages after it OR the next message isn't from Friend
        // 3. We haven't already responded to this message
        if (
            lastUserIndex !== -1 &&
            (messages.length === lastUserIndex + 1 || messages[lastUserIndex + 1].sender !== 'Friend') &&
            lastRespondedIndex.current !== lastUserIndex
        ) {
            const currentUserMessage = messages[lastUserIndex].text;
            
            // Log the type of process we're starting
            if (useRagMode) {
                console.log('🚀 Starting RAG process for query:', currentUserMessage);
            } else {
                console.log('💬 Starting regular chat for query:', currentUserMessage);
            }
            
            // Set loading state to prevent duplicate requests
            setIsLoading(true);
            
            // Async function to handle the response generation
            (async () => {
                // Create a placeholder message that will be updated with streaming content
                createPlaceholderMessage(setMessages);

                // Determine the system type for logging and error messages
                const systemType = useRagMode ? 'RAG' : 'Chat';
                
                // Get the final prompt (either with RAG context or simple chat)
                const finalPrompt = await getPrompt(useRagMode, currentUserMessage);
                
                // Submit the prompt to the LLM and handle streaming response
                const result = await submitMessageToLLM(
                    finalPrompt,
                    (text: string) => updateLastFriendMessage(setMessages, text)
                );

                // Handle any errors from the LLM response
                if (!result.success) {
                    const errorMessage = `Error getting response from ${systemType} system.` 
                    addErrorMessage(setMessages, errorMessage);
                }

                console.log(`✅ ${systemType} process completed successfully!`);

                // Mark this message as responded to
                lastRespondedIndex.current = lastUserIndex;
                
                // Clear loading state
                setIsLoading(false);
                console.log('🏁 Chat process finished');
            })();
        }
    }, [messages, isLoading, useRagMode]);

    return {
        messages,
        setMessages,
        isLoading
    };
}; 