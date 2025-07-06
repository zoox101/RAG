import React from 'react';

export type Page = 'chat' | 'chat-with-rag' | 'vector-search' | 'ollama-test';

interface NavigationProps {
    currentPage: Page;
    onPageChange: (page: Page) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
    return (
        <nav style={{
            background: '#f8f9fa',
            padding: '16px 24px',
            borderBottom: '1px solid #e9ecef',
            marginBottom: '24px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
            }}>
                <h1 style={{ 
                    margin: 0, 
                    fontSize: '24px', 
                    fontWeight: '600',
                    color: '#212529'
                }}>
                    RAG System
                </h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => onPageChange('chat')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentPage === 'chat' ? '#007aff' : '#e9ecef',
                            color: currentPage === 'chat' ? 'white' : '#495057',
                            fontWeight: currentPage === 'chat' ? '600' : '400',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Chat
                    </button>
                    <button
                        onClick={() => onPageChange('chat-with-rag')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentPage === 'chat-with-rag' ? '#007aff' : '#e9ecef',
                            color: currentPage === 'chat-with-rag' ? 'white' : '#495057',
                            fontWeight: currentPage === 'chat-with-rag' ? '600' : '400',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Chat with RAG
                    </button>
                    <button
                        onClick={() => onPageChange('vector-search')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentPage === 'vector-search' ? '#007aff' : '#e9ecef',
                            color: currentPage === 'vector-search' ? 'white' : '#495057',
                            fontWeight: currentPage === 'vector-search' ? '600' : '400',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Vector Search
                    </button>
                    <button
                        onClick={() => onPageChange('ollama-test')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: currentPage === 'ollama-test' ? '#007aff' : '#e9ecef',
                            color: currentPage === 'ollama-test' ? 'white' : '#495057',
                            fontWeight: currentPage === 'ollama-test' ? '600' : '400',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Ollama Test
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation; 