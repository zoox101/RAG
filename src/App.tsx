//------------------------------------------------------------------------------------------------//

import { PercentAllocation } from "./types";
import React, { useState } from "react";
import Chat from "./pages/Chat/Chat";
import ChatWithRag from "./pages/ChatWithRag/ChatWithRag";
import VectorSearch from "./pages/VectorSearch/VectorSearch";
import OllamaTest from "./pages/OllamaTest/OllamaTest";
import Navigation, { Page } from "./components/Navigation";

//------------------------------------------------------------------------------------------------//

export type ActiveLog = {
    startTimestamp: number;
    percentAllocations: PercentAllocation[];
}

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('chat-with-rag');

    const renderCurrentPage = () => {
        switch (currentPage) {
            case 'chat':
                return <Chat />;
            case 'chat-with-rag':
                return <ChatWithRag />;
            case 'vector-search':
                return <VectorSearch />;
            case 'ollama-test':
                return <OllamaTest />;
            default:
                return <ChatWithRag />;
        }
    };

    return (
        <div>
            <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                {renderCurrentPage()}
            </div>
        </div>
    );
}

export default App;

//------------------------------------------------------------------------------------------------//
