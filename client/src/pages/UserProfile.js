import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const UserProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('listings');
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    fetchRatings();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${username}`);
      setProfile(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page = 1) => {
    try {
      const response = await axios.get(`${API_URL}/users/${username}/posts?page=${page}`);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const fetchRatings = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${username}/ratings`);
      setRatings(response.data);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `€${parseFloat(price).toFixed(2)}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            color: i <= rating ? '#ffc107' : '#e4e5e9',
            fontSize: '1.1rem'
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ color: '#dc3545' }}>User Not Found</h2>
        <p style={{ color: '#666' }}>{error}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            border: '3px solid rgba(255,255,255,0.3)'
          }}>
            {profile.user.username.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>
              {profile.user.username}
              {profile.user.role !== 'user' && (
                <span style={{
                  marginLeft: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  background: profile.user.role === 'admin' ? '#dc3545' : '#17a2b8',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}>
                  {profile.user.role}
                </span>
              )}
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Member since {formatDate(profile.user.member_since)}
            </p>
          </div>

          {/* Rating Badge */}
          <div style={{
            textAlign: 'center',
            background: 'rgba(255,255,255,0.15)',
            padding: '1rem 1.5rem',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
              {profile.rating.average > 0 ? profile.rating.average.toFixed(1) : '-'}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
              {profile.rating.total_ratings} {profile.rating.total_ratings === 1 ? 'rating' : 'ratings'}
            </div>
          </div>

          {/* Send Message Button */}
          {user && user.username !== profile.user.username && (
            <button
              onClick={() => navigate(`/messages?with=${profile.user.id}`)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Send Message
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
            {profile.stats.total_posts}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Listings</div>
        </div>
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
            {profile.stats.active_posts}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Active</div>
        </div>
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#17a2b8' }}>
            {profile.stats.sold_posts}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Sold</div>
        </div>
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fd7e14' }}>
            {profile.stats.total_views}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Views</div>
        </div>
        <div style={{
          padding: '1.25rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <StarRating
              upvotes={profile.votes.upvotes_received}
              downvotes={profile.votes.downvotes_received}
              size="medium"
              showCount={false}
            />
          </div>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>Temperature</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #eee',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('listings')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeTab === 'listings' ? '#ff6f0f' : 'transparent',
            color: activeTab === 'listings' ? 'white' : '#666',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'listings' ? '600' : '400',
            fontSize: '0.95rem'
          }}
        >
          Listings ({profile.stats.active_posts})
        </button>
        <button
          onClick={() => setActiveTab('ratings')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: activeTab === 'ratings' ? '#ff6f0f' : 'transparent',
            color: activeTab === 'ratings' ? 'white' : '#666',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'ratings' ? '600' : '400',
            fontSize: '0.95rem'
          }}
        >
          Reviews ({profile.rating.total_ratings})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'listings' && (
        <div>
          {posts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #eee'
            }}>
              <h3 style={{ color: '#666', margin: 0 }}>No active listings</h3>
              <p style={{ color: '#999', marginTop: '0.5rem' }}>
                This user doesn't have any active listings at the moment.
              </p>
            </div>
          ) : (
            <>
              <div className="posts-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {posts.map(post => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      border: '1px solid #eee',
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '180px',
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999'
                        }}>
                          No Image
                        </div>
                      )}
                      <div style={{ padding: '1rem' }}>
                        <h3 style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '1rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {post.title}
                        </h3>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          marginBottom: '0.5rem'
                        }}>
                          {post.city_name}{post.district_name ? `, ${post.district_name}` : ''}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#ff6f0f',
                            fontSize: '1.1rem'
                          }}>
                            {formatPrice(post.price)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#999' }}>
                            {post.view_count || 0} views
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '2rem'
                }}>
                  <button
                    onClick={() => fetchPosts(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: pagination.hasPrevPage ? 'white' : '#f5f5f5',
                      cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                      color: pagination.hasPrevPage ? '#333' : '#999'
                    }}
                  >
                    Previous
                  </button>
                  <span style={{
                    padding: '0.5rem 1rem',
                    color: '#666'
                  }}>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchPosts(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: pagination.hasNextPage ? 'white' : '#f5f5f5',
                      cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                      color: pagination.hasNextPage ? '#333' : '#999'
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'ratings' && (
        <div>
          {ratings.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #eee'
            }}>
              <h3 style={{ color: '#666', margin: 0 }}>No reviews yet</h3>
              <p style={{ color: '#999', marginTop: '0.5rem' }}>
                This user hasn't received any reviews yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ratings.map(rating => (
                <div
                  key={rating.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid #eee',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <div style={{ marginBottom: '0.25rem' }}>
                        {renderStars(rating.rating)}
                      </div>
                      <Link
                        to={`/user/${rating.rater_username}`}
                        style={{
                          color: '#667eea',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        {rating.rater_username}
                      </Link>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>
                      {formatDate(rating.created_at)}
                    </span>
                  </div>
                  {rating.comment && (
                    <p style={{
                      margin: '0.75rem 0 0 0',
                      color: '#555',
                      lineHeight: '1.5'
                    }}>
                      {rating.comment}
                    </p>
                  )}
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #eee',
                    fontSize: '0.875rem',
                    color: '#888'
                  }}>
                    For: <Link
                      to={`/post/${rating.post_id}`}
                      style={{ color: '#667eea', textDecoration: 'none' }}
                    >
                      {rating.post_title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
