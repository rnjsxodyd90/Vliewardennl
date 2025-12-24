import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';
import StarRating from '../components/StarRating';
import RatingForm from '../components/RatingForm';
import VoteButtons from '../components/VoteButtons';

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <VoteButtons contentType="post" contentId={post.id} size="large" />
              <h1 className="post-detail-title" style={{ margin: 0 }}>{post.title}</h1>
            </div>
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
              {post.view_count > 0 && (
                <div>👁️ {post.view_count} view{post.view_count !== 1 ? 's' : ''}</div>
              )}
              {post.price && post.pay_type && (
                <div>💰 {formatPrice(post.price)} {post.pay_type === 'hourly' ? '/hour' : '(total)'}</div>
              )}
              {post.location && (
                <div>🏠 {post.location}</div>
              )}
              {post.work_days && (
                <div>📆 {post.work_days}</div>
              )}
              {(post.start_time || post.end_time) && (
                <div>🕐 {post.start_time || '?'} - {post.end_time || '?'}</div>
              )}
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

        {/* Contact Seller Section - Only show if seller agreed */}
        {!isOwner && post.status === 'active' && post.show_contact_info && (post.contact_email || post.contact_phone || post.contact_whatsapp) && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📞 Contact Seller
            </h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
              Interested in this listing? Reach out to {post.username} directly:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {post.contact_email && (
                <a
                  href={`mailto:${post.contact_email}?subject=Inquiry about: ${post.title}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: '#ff6f0f',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#e55a00'}
                  onMouseOut={(e) => e.target.style.background = '#ff6f0f'}
                >
                  ✉️ Email
                </a>
              )}
              {post.contact_phone && (
                <a
                  href={`tel:${post.contact_phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#218838'}
                  onMouseOut={(e) => e.target.style.background = '#28a745'}
                >
                  📱 {post.contact_phone}
                </a>
              )}
              {post.contact_whatsapp && (
                <a
                  href={`https://wa.me/${post.contact_whatsapp.replace(/[^0-9]/g, '')}?text=Hi! I'm interested in your listing: ${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    background: '#25D366',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#128C7E'}
                  onMouseOut={(e) => e.target.style.background = '#25D366'}
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* No contact info message for active posts */}
        {!isOwner && post.status === 'active' && (!post.show_contact_info || (!post.contact_email && !post.contact_phone && !post.contact_whatsapp)) && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#e3f2fd',
            borderRadius: '12px',
            border: '1px solid #90caf9'
          }}>
            <p style={{ margin: 0, color: '#1565c0' }}>
              💬 Interested? Use the comments below to reach out to the seller.
            </p>
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
