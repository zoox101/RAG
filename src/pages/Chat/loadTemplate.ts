// Prompt templates for the RAG chat system

export interface PromptContext {
    context?: string;
    userQuestion?: string;
    [key: string]: string | undefined;
}

/**
 * Simple template processor that replaces {{variable}} placeholders
 */
const processTemplate = (template: string, context: PromptContext): string => {
    let result = template;
    
    // Replace all {{variable}} placeholders with actual values
    Object.entries(context).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        if (value !== undefined) {
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
    });
    
    return result;
};

/**
 * Load a template file and process it with the given context
 */
export const loadTemplate = async (
    templateName: string, 
    context: PromptContext
): Promise<string> => {
    try {
        const response = await fetch(`/src/pages/Chat/prompts/${templateName}.template`);
        if (!response.ok) {
            throw new Error(`Failed to load template: ${templateName}`);
        }
        const template = await response.text();
        return processTemplate(template, context);
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        throw error;
    }
}; 