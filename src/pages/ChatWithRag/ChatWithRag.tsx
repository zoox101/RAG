import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useOllamaChat } from './useOllamaChat';

export interface Message {
    text: string;
    sender: string;
}

const markdownStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    lineHeight: 1.4,
    fontSize: 16,
};

const ChatWithRag: React.FC = () => {
    const { messages, setMessages } = useOllamaChat();
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

    return (
        <div style={{ 
            width: '100%', 
            height: 'calc(100vh - 120px)', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#f7f7f7',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            <h2 style={{ textAlign: 'center', margin: 16, color: '#333' }}>Chat with RAG</h2>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 24px' }}>
                    {messages.map((message, index) => {
                        const isYou = message.sender === 'You';
                        return (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: isYou ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div
                                    style={{
                                        background: isYou ? '#007aff' : '#e5e5ea',
                                        color: isYou ? 'white' : '#222',
                                        padding: '6px 12px',
                                        borderRadius: 20,
                                        maxWidth: '70%',
                                        wordBreak: 'break-word',
                                        marginLeft: isYou ? 40 : 0,
                                        marginRight: isYou ? 0 : 40,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                        lineHeight: 1.4,
                                    }}
                                >
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p style={{ margin: 0, padding: 0, lineHeight: 1.4 }}>{props.children}</p>,
                                            ul: ({ node, ...props }) => <ul style={{ margin: '4px 0', paddingLeft: 18 }}>{props.children}</ul>,
                                            ol: ({ node, ...props }) => <ol style={{ margin: '4px 0', paddingLeft: 18 }}>{props.children}</ol>,
                                            li: ({ node, ...props }) => <li style={{ margin: 0, padding: 0 }}>{props.children}</li>,
                                            pre: ({ node, ...props }) => <pre style={{ margin: '4px 0', padding: 8, background: '#222', color: '#fff', borderRadius: 8, fontSize: 14 }}>{props.children}</pre>,
                                            code: ({ node, ...props }) => <code style={{ background: '#eee', borderRadius: 4, padding: '1px 4px', fontSize: 14 }}>{props.children}</code>,
                                            h1: ({ node, ...props }) => <h1 style={{ margin: '4px 0', fontSize: 20 }}>{props.children}</h1>,
                                            h2: ({ node, ...props }) => <h2 style={{ margin: '4px 0', fontSize: 18 }}>{props.children}</h2>,
                                            h3: ({ node, ...props }) => <h3 style={{ margin: '4px 0', fontSize: 16 }}>{props.children}</h3>,
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
            <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: 16, borderTop: '1px solid #eee', background: '#fff' }}>
                <input
                    style={{ flex: 1, height: 40, borderRadius: 20, border: '1px solid #ccc', padding: '0 16px', fontSize: 16, outline: 'none' }}
                    type="text"
                    placeholder="Type a new message..."
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                />
                <button type="submit" style={{ marginLeft: 8, padding: '0 20px', borderRadius: 20, border: 'none', background: '#007aff', color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer', height: 40 }}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatWithRag;