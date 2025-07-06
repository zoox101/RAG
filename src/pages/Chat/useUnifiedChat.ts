import { useState, useEffect, useRef } from 'react';
import { loadTemplate } from './utils/loadTemplate';
import { 
    submitMessageToLLM, 
    createPlaceholderMessage, 
    updateLastFriendMessage, 
    addErrorMessage,
    Message 
} from './utils/messageSubmission';
import { getRagContext } from './utils/getRagContext';


const getFinalPrompt = async (useRagMode: boolean, currentUserMessage: string) => {
    // Getting the prompt to submit
    let finalPrompt = '';
    if (useRagMode) {
        // Get RAG context using the utility
        const ragResult = await getRagContext(currentUserMessage);
        
        if (!ragResult.success) {
            throw new Error(ragResult.error || 'Failed to get RAG context');
        }

        // Create enhanced prompt with retrieved context
        finalPrompt = await loadTemplate("rag", {
            context: ragResult.context || '',
            userQuestion: currentUserMessage
        });

        console.log('🎯 Enhanced prompt created:', finalPrompt);
    } else {
        // Create simple prompt without conversation history
        finalPrompt = await loadTemplate("chat", {
            userQuestion: currentUserMessage
        });
    }
    return finalPrompt;
}

export const useUnifiedChat = (useRagMode: boolean = true) => {
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
            const currentUserMessage = messages[lastUserIndex].text;
            
            if (useRagMode) {
                console.log('🚀 Starting RAG process for query:', currentUserMessage);
            } else {
                console.log('💬 Starting regular chat for query:', currentUserMessage);
            }
            
            setIsLoading(true);
            (async () => {
                // Create placeholder message for streaming
                createPlaceholderMessage(setMessages);

                const systemType = useRagMode ? 'RAG' : 'Chat';
                const finalPrompt = await getFinalPrompt(useRagMode, currentUserMessage);

                console.log('📤 Sending to model:', finalPrompt);

                // Submit message to LLM using shared logic
                const result = await submitMessageToLLM(
                    finalPrompt,
                    (text: string) => updateLastFriendMessage(setMessages, text)
                );

                if (!result.success) {
                    const errorMessage = `Error getting response from ${systemType} system.` 
                    addErrorMessage(setMessages, errorMessage);
                }

                console.log(`✅ ${systemType} process completed successfully!`);

                lastRespondedIndex.current = lastUserIndex;
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