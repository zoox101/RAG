import React, { useState, useEffect } from 'react';
import './VectorStoreManager.css';

interface Document {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}

interface CollectionInfo {
    name: string;
    count: number;
    metadata?: Record<string, any>;
}

const VectorStoreManager: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [collectionInfo, setCollectionInfo] = useState<CollectionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newDocument, setNewDocument] = useState({ content: '', metadata: '' });
    const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Fetch collection info and documents
    const fetchCollectionData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [infoResponse, docsResponse] = await Promise.all([
                fetch('http://localhost:8000/collection/info'),
                fetch('http://localhost:8000/collection/documents')
            ]);

            if (!infoResponse.ok || !docsResponse.ok) {
                throw new Error('Failed to fetch collection data');
            }

            const info = await infoResponse.json();
            const docs = await docsResponse.json();

            setCollectionInfo(info);
            setDocuments(docs.documents || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollectionData();
    }, []);

    // Add new document
    const handleAddDocument = async () => {
        if (!newDocument.content.trim()) {
            setError('Document content is required');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const metadata = newDocument.metadata ? JSON.parse(newDocument.metadata) : {};
            
            const response = await fetch('http://localhost:8000/collection/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newDocument.content,
                    metadata
                })
            });

            if (!response.ok) {
                throw new Error('Failed to add document');
            }

            setNewDocument({ content: '', metadata: '' });
            setShowAddForm(false);
            await fetchCollectionData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add document');
        } finally {
            setUploading(false);
        }
    };

    // Delete selected documents
    const handleDeleteSelected = async () => {
        if (selectedDocuments.size === 0) {
            setError('Please select documents to delete');
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:8000/collection/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: Array.from(selectedDocuments)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to delete documents');
            }

            setSelectedDocuments(new Set());
            await fetchCollectionData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete documents');
        } finally {
            setLoading(false);
        }
    };

    // Clear entire collection
    const handleClearCollection = async () => {
        if (!confirm('Are you sure you want to clear the entire collection? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:8000/collection/clear', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to clear collection');
            }

            setSelectedDocuments(new Set());
            await fetchCollectionData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clear collection');
        } finally {
            setLoading(false);
        }
    };

    // Toggle document selection
    const toggleDocumentSelection = (id: string) => {
        const newSelected = new Set(selectedDocuments);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDocuments(newSelected);
    };

    // Select all documents
    const selectAll = () => {
        setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    };

    // Deselect all documents
    const deselectAll = () => {
        setSelectedDocuments(new Set());
    };

    // Filter documents based on search term
    const filteredDocuments = documents.filter(doc =>
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && documents.length === 0) {
        return (
            <div className="vector-store-manager">
                <div className="loading">Loading vector store data...</div>
            </div>
        );
    }

    return (
        <div className="vector-store-manager">
            <div className="header">
                <h1>🗄️ Vector Store Manager</h1>
                <p>Manage your RAG vector store documents and collections</p>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* Collection Info */}
            {collectionInfo && (
                <div className="collection-info">
                    <div className="info-card">
                        <h3>Collection: {collectionInfo.name}</h3>
                        <p>Total Documents: {collectionInfo.count}</p>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            <div className="actions-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="action-buttons">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        ➕ Add Document
                    </button>
                    
                    {selectedDocuments.size > 0 && (
                        <>
                            <button 
                                className="btn btn-danger"
                                onClick={handleDeleteSelected}
                                disabled={loading}
                            >
                                🗑️ Delete Selected ({selectedDocuments.size})
                            </button>
                        </>
                    )}
                    
                    <button 
                        className="btn btn-warning"
                        onClick={handleClearCollection}
                        disabled={loading}
                    >
                        🧹 Clear Collection
                    </button>
                    
                    <button 
                        className="btn btn-secondary"
                        onClick={fetchCollectionData}
                        disabled={loading}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Add Document Form */}
            {showAddForm && (
                <div className="add-document-form">
                    <h3>Add New Document</h3>
                    <div className="form-group">
                        <label>Content:</label>
                        <textarea
                            value={newDocument.content}
                            onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                            placeholder="Enter document content..."
                            rows={4}
                        />
                    </div>
                    <div className="form-group">
                        <label>Metadata (JSON):</label>
                        <textarea
                            value={newDocument.metadata}
                            onChange={(e) => setNewDocument({...newDocument, metadata: e.target.value})}
                            placeholder='{"source": "example", "category": "test"}'
                            rows={2}
                        />
                    </div>
                    <div className="form-actions">
                        <button 
                            className="btn btn-primary"
                            onClick={handleAddDocument}
                            disabled={uploading}
                        >
                            {uploading ? 'Adding...' : 'Add Document'}
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={() => setShowAddForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Documents List */}
            <div className="documents-section">
                <div className="documents-header">
                    <h3>Documents ({filteredDocuments.length})</h3>
                    <div className="selection-controls">
                        <button 
                            className="btn btn-small"
                            onClick={selectAll}
                        >
                            Select All
                        </button>
                        <button 
                            className="btn btn-small"
                            onClick={deselectAll}
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                {filteredDocuments.length === 0 ? (
                    <div className="no-documents">
                        {searchTerm ? 'No documents match your search.' : 'No documents in the collection.'}
                    </div>
                ) : (
                    <div className="documents-list">
                        {filteredDocuments.map((doc) => (
                            <div 
                                key={doc.id} 
                                className={`document-item ${selectedDocuments.has(doc.id) ? 'selected' : ''}`}
                            >
                                <div className="document-header">
                                    <input
                                        type="checkbox"
                                        checked={selectedDocuments.has(doc.id)}
                                        onChange={() => toggleDocumentSelection(doc.id)}
                                    />
                                    <span className="document-id">ID: {doc.id}</span>
                                    {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                        <span className="document-meta">
                                            📋 {Object.keys(doc.metadata).length} metadata fields
                                        </span>
                                    )}
                                </div>
                                <div className="document-content">
                                    {doc.content.length > 200 
                                        ? `${doc.content.substring(0, 200)}...` 
                                        : doc.content
                                    }
                                </div>
                                {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                    <div className="document-metadata">
                                        <strong>Metadata:</strong>
                                        <pre>{JSON.stringify(doc.metadata, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VectorStoreManager; 