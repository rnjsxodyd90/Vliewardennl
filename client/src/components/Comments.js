import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VoteButtons from './VoteButtons';
import ReportButton from './ReportButton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Comments = ({ postId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/comments/post/${postId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please login to comment');
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/comments`, {
        post_id: postId,
        content: content.trim()
      });
      
      setContent('');
      fetchComments();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      alert('Failed to delete comment');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NL', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comments-section">
      <h2 className="comments-header">Comments ({comments.length})</h2>
      
      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows="4"
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '4px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#666', margin: 0 }}>
            Please <a href="/login" style={{ color: '#ff6f0f' }}>login</a> to leave a comment.
          </p>
        </div>
      )}

      <div>
        {comments.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <VoteButtons 
                    contentType="comment" 
                    contentId={comment.id} 
                    size="small"
                  />
                  <span className="comment-author">{comment.username}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="comment-date">{formatDate(comment.created_at)}</span>
                  {user && user.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Delete
                    </button>
                  )}
                  {user && user.id !== comment.user_id && (
                    <ReportButton contentType="comment" contentId={comment.id} size="small" />
                  )}
                </div>
              </div>
              <div className="comment-content" style={{ marginLeft: '48px' }}>{comment.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
