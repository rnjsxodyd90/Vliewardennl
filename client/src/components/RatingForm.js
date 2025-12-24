import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RatingForm = ({ postId, onRatingSubmitted }) => {
  const { user } = useAuth();
  const [canRate, setCanRate] = useState(false);
  const [reason, setReason] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      checkCanRate();
    }
  }, [user, postId]);

  const checkCanRate = async () => {
    try {
      const response = await axios.get(`${API_URL}/ratings/can-rate/${postId}`);
      setCanRate(response.data.canRate);
      setReason(response.data.reason || '');
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/ratings`, {
        post_id: postId,
        rating,
        comment: comment.trim() || null
      });
      
      setSuccess(true);
      setCanRate(false);
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (success) {
    return (
      <div style={{ 
        padding: '1rem', 
        background: '#d4edda', 
        borderRadius: '8px',
        marginTop: '1rem',
        color: '#155724'
      }}>
        ✓ Thank you for your rating!
      </div>
    );
  }

  if (!canRate) {
    if (reason) {
      return (
        <div style={{ 
          padding: '1rem', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          marginTop: '1rem',
          color: '#666',
          fontSize: '0.9rem'
        }}>
          {reason}
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ 
      padding: '1.5rem', 
      background: '#fff3cd', 
      borderRadius: '8px',
      marginTop: '1rem'
    }}>
      <h4 style={{ marginBottom: '1rem', color: '#856404' }}>Rate this seller</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '2rem',
                  color: star <= (hoverRating || rating) ? '#FFB800' : '#ddd',
                  transition: 'color 0.15s'
                }}
              >
                ★
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.875rem', color: '#666' }}>
            {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate'}
          </span>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment about your experience (optional)"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px'
            }}
          />
        </div>

        {error && <div style={{ color: '#dc3545', marginBottom: '0.5rem' }}>{error}</div>}

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || rating === 0}
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
};

export default RatingForm;

