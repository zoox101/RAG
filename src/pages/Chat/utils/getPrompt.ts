import fetchRagContext from "./fetchRagContext";
import { loadTemplate } from "./loadTemplate";
import { Message } from "./useChat";
import getLastMessage from "./getLastMessage";

export default async (messages: Message[], isRagMode: boolean) => {

    const currentMessage = getLastMessage(messages, "You");

    if (!currentMessage) {
        throw new Error("No current message found");
    }

    // No rag mode, return the simple LLM response
    if (!isRagMode) {
        return await loadTemplate("chat", {
            userQuestion: currentMessage.text
        });
    }

    // Get RAG context using the utility
    const ragResult = await fetchRagContext(currentMessage.text);

    // Handle any errors from the RAG context retrieval
    if (!ragResult.success) {
        throw new Error(ragResult.error || 'Failed to get RAG context');
    }

    // Create enhanced prompt with retrieved context
    const finalPrompt = await loadTemplate("rag", {
        context: ragResult.context || '',
        userQuestion: currentMessage.text
    });

    console.log('🎯 Enhanced prompt created:', finalPrompt);

    return finalPrompt;

}