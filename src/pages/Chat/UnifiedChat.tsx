import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useUnifiedChat } from './useUnifiedChat';
import './UnifiedChat.css';

// Define Message interface locally since it's not exported from useUnifiedChat
interface Message {
    text: string;
    sender: string;
}

const UnifiedChat: React.FC = () => {
    const [useRagMode, setUseRagMode] = useState(true);
    const { messages, setMessages, isLoading } = useUnifiedChat(useRagMode);
    const [newMessageText, setNewMessageText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessageText.trim() !== '') {
            const newMessage: Message = { text: newMessageText, sender: 'You' };
            setMessages([...messages, newMessage]);
            setNewMessageText('');
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    return (
        <div className="unified-chat-container">
            {/* Header with controls */}
            <div className="chat-header">
                <h2>
                    {useRagMode ? 'Chat with RAG' : 'Chat'}
                </h2>
                <div className="chat-controls">
                    <label className="rag-toggle-label">
                        <input
                            type="checkbox"
                            checked={useRagMode}
                            onChange={(e) => setUseRagMode(e.target.checked)}
                            className="rag-toggle-checkbox"
                        />
                        Enable RAG
                    </label>
                    <button
                        onClick={handleClearChat}
                        className="clear-chat-button"
                    >
                        Clear Chat
                    </button>
                </div>
            </div>

            {/* Status indicator */}
            {useRagMode && (
                <div className="rag-status-indicator">
                    🔍 RAG Mode: Enhanced responses with vector search and context retrieval
                </div>
            )}

            {/* Messages area */}
            <div className="messages-container">
                <div className="messages-scroll-area">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            {useRagMode 
                                ? 'Start a conversation with RAG-enhanced responses! 🚀'
                                : 'Start a conversation! 💬'
                            }
                        </div>
                    )}
                    {messages.map((message, index) => {
                        const isYou = message.sender === 'You';
                        return (
                            <div
                                key={index}
                                className={`message-wrapper ${isYou ? 'user' : 'assistant'}`}
                            >
                                <div className={`message-bubble ${isYou ? 'user' : 'assistant'}`}>
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="markdown-paragraph">{props.children}</p>,
                                            ul: ({ node, ...props }) => <ul className="markdown-list">{props.children}</ul>,
                                            ol: ({ node, ...props }) => <ol className="markdown-list">{props.children}</ol>,
                                            li: ({ node, ...props }) => <li className="markdown-list-item">{props.children}</li>,
                                            pre: ({ node, ...props }) => <pre className="markdown-pre">{props.children}</pre>,
                                            code: ({ node, ...props }) => <code className="markdown-code">{props.children}</code>,
                                            h1: ({ node, ...props }) => <h1 className="markdown-heading-1">{props.children}</h1>,
                                            h2: ({ node, ...props }) => <h2 className="markdown-heading-2">{props.children}</h2>,
                                            h3: ({ node, ...props }) => <h3 className="markdown-heading-3">{props.children}</h3>,
                                        }}
                                    >
                                        {message.text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
                <input
                    className="chat-input"
                    type="text"
                    placeholder={isLoading ? "Generating response..." : "Type a new message..."}
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    disabled={isLoading}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || !newMessageText.trim()}
                    className="send-button"
                >
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default UnifiedChat; 