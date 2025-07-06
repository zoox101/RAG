// RAG context retrieval logic

const OLLAMA_EMBED_URL = 'http://localhost:11434/api/embeddings';
const CHROMA_QUERY_URL = 'http://localhost:8000/query_vector';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text';

export interface RagContextResult {
    success: boolean;
    context?: string;
    error?: string;
}

/**
 * Gets RAG context for a user query by:
 * 1. Generating embeddings for the query
 * 2. Searching the vector database for relevant documents
 * 3. Formatting the retrieved context
 */
export const getRagContext = async (userQuery: string): Promise<RagContextResult> => {
    try {
        // Step 1: Get embedding for the user's query
        console.log('📊 Step 1: Getting embedding for query...');
        const embedRes = await fetch(OLLAMA_EMBED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: userQuery }),
        });
        
        if (!embedRes.ok) {
            throw new Error('Failed to get embedding from Ollama');
        }
        
        const embedData = await embedRes.json();
        const vector = embedData.embedding;
        console.log('✅ Embedding generated successfully. Vector length:', vector.length);

        // Step 2: Query Chroma server for relevant documents
        console.log('🔍 Step 2: Querying Chroma DB for relevant documents...');
        const chromaRes = await fetch(CHROMA_QUERY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vector, n_results: 3 }),
        });
        
        if (!chromaRes.ok) {
            throw new Error('Failed to query Chroma server');
        }
        
        const chromaData = await chromaRes.json();
        console.log('📚 Chroma query results:', chromaData);

        // Step 3: Format the retrieved context
        console.log('📝 Step 3: Formatting retrieved context...');
        let context = '';
        if (chromaData.documents && chromaData.documents[0]) {
            context = '\n\nRelevant context:\n' + chromaData.documents[0].join('\n\n');
            console.log('📄 Retrieved context:', context);
        } else {
            console.log('⚠️ No relevant documents found in Chroma DB');
        }

        return {
            success: true,
            context
        };
    } catch (error) {
        console.error('❌ Error in RAG context retrieval:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during RAG context retrieval'
        };
    }
}; 