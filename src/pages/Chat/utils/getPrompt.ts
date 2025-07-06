import fetchRagContext from "./fetchRagContext";
import { loadTemplate } from "./loadTemplate";

export default async function getFinalPrompt (useRagMode: boolean, currentUserMessage: string) {
    // Getting the prompt to submit
    let finalPrompt = '';
    if (useRagMode) {
        // Get RAG context using the utility
        const ragResult = await fetchRagContext(currentUserMessage);
        
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