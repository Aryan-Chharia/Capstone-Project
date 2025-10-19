import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chatAPI, projectAPI } from '../services/api';
import { Message, Project } from '../types';

const Chat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchChatHistory();
    }
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getProject(projectId!);
      if (response.project) {
        setProject(response.project);
      }
    } catch (err: any) {
      setError('Failed to load project details');
      console.error(err);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await chatAPI.getChatHistory(projectId!);
      if (response.chat) {
        setMessages(response.chat.messages || []);
      }
    } catch (err: any) {
      setError('Failed to load chat history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage({
        projectId: projectId!,
        content: newMessage.trim(),
        image: selectedFile || undefined
      });

      // Add user message to UI immediately
      const userMessage: Message = {
        _id: Date.now().toString(),
        chat: '',
        sender: 'user',
        content: newMessage.trim(),
        imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
        messageType: selectedFile ? (newMessage.trim() ? 'both' : 'image') : 'text',
        references: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage]);

      // Add bot response if available
      if (response.botReply) {
        const botMessage: Message = {
          _id: (Date.now() + 1).toString(),
          chat: '',
          sender: 'chatbot',
          content: response.botReply,
          messageType: 'text',
          confidenceScore: response.confidenceScore,
          references: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
      }

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid h-100">
      {/* Header */}
      <div className="row bg-light p-3 border-bottom">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">
                {project?.name} - Chat
              </h4>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/dashboard">Dashboard</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to="/projects">Projects</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link to={`/projects/${projectId}`}>{project?.name}</Link>
                  </li>
                  <li className="breadcrumb-item active">Chat</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger m-3" role="alert">
          {error}
        </div>
      )}

      <div className="row" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Chat Messages */}
        <div className="col-12">
          <div className="d-flex flex-column h-100">
            {/* Messages Container */}
            <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {messages.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <p>No messages yet. Start a conversation with the AI assistant!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`mb-3 d-flex ${
                      message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'
                    }`}
                  >
                    <div
                      className={`max-w-75 p-3 rounded ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-light text-dark'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      <div className="d-flex align-items-start mb-1">
                        <strong className="me-2">
                          {message.sender === 'user' ? 'You' : 'AI Assistant'}
                        </strong>
                        <small className="text-muted">
                          {formatTimestamp(message.createdAt)}
                        </small>
                      </div>
                      
                      {message.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={message.imageUrl}
                            alt="Uploaded"
                            className="img-fluid rounded"
                            style={{ maxWidth: '200px', maxHeight: '200px' }}
                          />
                        </div>
                      )}
                      
                      {message.content && (
                        <div className="mb-1">
                          {message.content}
                        </div>
                      )}
                      
                      {message.confidenceScore && (
                        <div>
                          <small className="text-muted">
                            Confidence: {Math.round(message.confidenceScore * 100)}%
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-top p-3">
              <form onSubmit={handleSendMessage}>
                {selectedFile && (
                  <div className="mb-2 p-2 bg-light rounded d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      📎 {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={removeSelectedFile}
                    >
                      Remove
                    </button>
                  </div>
                )}
                
                <div className="input-group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📎
                  </button>
                  
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || (!newMessage.trim() && !selectedFile)}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
