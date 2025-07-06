import fetchRagContext from "./fetchRagContext";
import { loadTemplate } from "./loadTemplate";
import { Message } from "./useChat";
import getLastMessage from "./getLastMessage";

export default async (messages: Message[], useRagMode: boolean) => {

    const currentMessage = getLastMessage(messages, "You");

    if (!currentMessage) {
        throw new Error("No current message found");
    }

    // Getting the prompt to submit
    let finalPrompt = '';
    if (useRagMode) {
        // Get RAG context using the utility
        const ragResult = await fetchRagContext(currentMessage.text);
        
        if (!ragResult.success) {
            throw new Error(ragResult.error || 'Failed to get RAG context');
        }

        // Create enhanced prompt with retrieved context
        finalPrompt = await loadTemplate("rag", {
            context: ragResult.context || '',
            userQuestion: currentMessage.text
        });

        console.log('🎯 Enhanced prompt created:', finalPrompt);
    } else {
        // Create simple prompt without conversation history
        finalPrompt = await loadTemplate("chat", {
            userQuestion: currentMessage.text
        });
    }
    return finalPrompt;
}