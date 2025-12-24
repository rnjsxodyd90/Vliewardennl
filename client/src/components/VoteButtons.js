import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VoteButtons = ({ contentType, contentId, initialScore = 0, size = 'medium' }) => {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVotes();
    if (user) {
      fetchUserVote();
    }
  }, [contentType, contentId, user]);

  const fetchVotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/votes/${contentType}/${contentId}`);
      setScore(response.data.score);
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const fetchUserVote = async () => {
    try {
      const response = await axios.get(`${API_URL}/votes/${contentType}/${contentId}/user`);
      setUserVote(response.data.userVote);
    } catch (error) {
      console.error('Error fetching user vote:', error);
    }
  };

  const handleVote = async (voteType) => {
    if (!user) {
      alert('Please login to vote');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/votes`, {
        content_type: contentType,
        content_id: contentId,
        vote_type: voteType
      });
      setScore(response.data.score);
      setUserVote(response.data.userVote);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  const buttonSize = size === 'small' ? '20px' : size === 'large' ? '32px' : '24px';
  const fontSize = size === 'small' ? '0.75rem' : size === 'large' ? '1.1rem' : '0.9rem';

  return (
    <div className="vote-buttons" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: size === 'small' ? '4px' : '6px',
      background: '#f8f9fa',
      borderRadius: '20px',
      padding: size === 'small' ? '2px 6px' : '4px 10px'
    }}>
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          cursor: user ? 'pointer' : 'default',
          padding: '2px',
          fontSize: buttonSize,
          color: userVote === 1 ? '#ff6f0f' : '#999',
          transition: 'color 0.15s, transform 0.1s',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Upvote"
        onMouseEnter={(e) => user && (e.target.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        ▲
      </button>
      
      <span style={{
        fontWeight: '600',
        fontSize: fontSize,
        color: score > 0 ? '#28a745' : score < 0 ? '#dc3545' : '#666',
        minWidth: size === 'small' ? '20px' : '28px',
        textAlign: 'center'
      }}>
        {score}
      </span>
      
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        style={{
          background: 'none',
          border: 'none',
          cursor: user ? 'pointer' : 'default',
          padding: '2px',
          fontSize: buttonSize,
          color: userVote === -1 ? '#6c5ce7' : '#999',
          transition: 'color 0.15s, transform 0.1s',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Downvote"
        onMouseEnter={(e) => user && (e.target.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        ▼
      </button>
    </div>
  );
};

export default VoteButtons;

