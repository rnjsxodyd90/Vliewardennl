import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import StarRating from '../components/StarRating';
import RatingForm from '../components/RatingForm';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      setError('Post not found');
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `€${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMarkAsSold = async () => {
    try {
      await axios.put(`${API_URL}/posts/${id}`, { status: 'sold' });
      fetchPost();
    } catch (error) {
      alert('Failed to update post status');
    }
  };

  if (loading) {
    return <div className="loading">Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div className="empty-state">
        <h3>{error || 'Post not found'}</h3>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Go Home
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === post.user_id;

  return (
    <div>
      <div className="post-detail">
        <div className="post-detail-header">
          <div className="post-detail-info">
            <h1 className="post-detail-title">{post.title}</h1>
            {post.price && <div className="post-detail-price">{formatPrice(post.price)}</div>}
            <div className="post-detail-meta">
              <div>📍 {post.city_name}, {post.province}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                👤 {post.username}
                <StarRating 
                  rating={post.user_rating || 0} 
                  count={post.rating_count || 0} 
                  size="medium" 
                />
              </div>
              <div>📅 {formatDate(post.created_at)}</div>
              {post.status !== 'active' && (
                <div style={{ 
                  color: post.status === 'sold' ? '#28a745' : '#dc3545', 
                  fontWeight: 'bold', 
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem',
                  background: post.status === 'sold' ? '#d4edda' : '#f8d7da',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {post.status.toUpperCase()}
                </div>
              )}
            </div>
            {isOwner && (
              <div style={{ marginTop: '1rem' }}>
                <button 
                  onClick={() => navigate(`/edit/${post.id}`)} 
                  className="btn btn-secondary"
                  style={{ marginRight: '0.5rem' }}
                >
                  Edit Post
                </button>
                {post.status === 'active' && (
                  <button 
                    onClick={handleMarkAsSold}
                    className="btn btn-secondary"
                  >
                    Mark as Sold
                  </button>
                )}
              </div>
            )}
          </div>
          {post.image_url && (
            <img src={post.image_url} alt={post.title} className="post-detail-image" />
          )}
        </div>
        {post.description && (
          <div className="post-detail-description">
            <h3 style={{ marginBottom: '1rem' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{post.description}</p>
          </div>
        )}

        {/* Rating section - only show for sold items and non-owners */}
        {post.status === 'sold' && !isOwner && (
          <RatingForm postId={id} onRatingSubmitted={fetchPost} />
        )}
      </div>

      <Comments postId={id} />
    </div>
  );
};

export default PostDetail;
