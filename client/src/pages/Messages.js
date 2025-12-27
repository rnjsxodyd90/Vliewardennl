import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();

    // Check if we should start a conversation with a specific user
    const startWith = searchParams.get('with');
    if (startWith) {
      startConversation(parseInt(startWith));
    }

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, navigate, searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (userId) => {
    try {
      const response = await axios.post(`${API_URL}/messages/start/${userId}`);
      setSelectedConversation(response.data.conversation_id);
      setOtherUser(response.data.other_user);
      fetchMessages(response.data.conversation_id);
      fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversations/${conversationId}`);
      setMessages(response.data.messages);
      setOtherUser(response.data.other_user);

      // Mark messages as read
      await axios.put(`${API_URL}/messages/conversations/${conversationId}/read`);
      fetchConversations(); // Refresh to update unread counts
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv.id);
    setOtherUser({ id: conv.other_user_id, username: conv.other_username });
    fetchMessages(conv.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await axios.post(`${API_URL}/messages/conversations/${selectedConversation}`, {
        content: messageText.trim()
      });
      setMessageText('');
      fetchMessages(selectedConversation);
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-NL', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-NL', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-NL', { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-NL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', color: '#333' }}>Messages</h1>

      <div style={{
        display: 'flex',
        gap: '1rem',
        height: 'calc(100vh - 200px)',
        minHeight: '500px',
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #eee',
        overflow: 'hidden'
      }}>
        {/* Conversations List */}
        <div style={{
          width: '300px',
          borderRight: '1px solid #eee',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #eee',
            fontWeight: '600',
            color: '#333'
          }}>
            Conversations
          </div>

          {conversations.length === 0 ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#999'
            }}>
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: 'pointer',
                  background: selectedConversation === conv.id ? '#f8f9fa' : 'white',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation !== conv.id) {
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation !== conv.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontWeight: conv.unread_count > 0 ? '600' : '500',
                    color: '#333'
                  }}>
                    {conv.other_username}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    {formatDate(conv.last_message_at)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: conv.unread_count > 0 ? '#333' : '#666',
                    fontWeight: conv.unread_count > 0 ? '500' : 'normal',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: '0.5rem'
                  }}>
                    {conv.last_message || 'No messages yet'}
                  </span>
                  {conv.unread_count > 0 && (
                    <span style={{
                      background: '#ff6f0f',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Thread */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}>
          {selectedConversation && otherUser ? (
            <>
              {/* Thread Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#667eea',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600'
                }}>
                  {otherUser.username.charAt(0).toUpperCase()}
                </div>
                <Link
                  to={`/user/${otherUser.username}`}
                  style={{
                    fontWeight: '600',
                    color: '#333',
                    textDecoration: 'none'
                  }}
                >
                  {otherUser.username}
                </Link>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#999',
                    marginTop: '2rem'
                  }}>
                    Start the conversation by sending a message
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: msg.sender_id === user.id
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                        background: msg.sender_id === user.id ? '#ff6f0f' : '#f0f0f0',
                        color: msg.sender_id === user.id ? 'white' : '#333'
                      }}>
                        <div style={{ wordBreak: 'break-word' }}>{msg.content}</div>
                        <div style={{
                          fontSize: '0.7rem',
                          opacity: 0.7,
                          marginTop: '0.25rem',
                          textAlign: msg.sender_id === user.id ? 'right' : 'left'
                        }}>
                          {formatMessageTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '1rem',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  gap: '0.75rem'
                }}
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #ddd',
                    borderRadius: '24px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: sending || !messageText.trim() ? '#ccc' : '#ff6f0f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    fontWeight: '600',
                    cursor: sending || !messageText.trim() ? 'not-allowed' : 'pointer'
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                <div>Select a conversation to start messaging</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
