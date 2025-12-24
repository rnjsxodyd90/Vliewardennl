import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StarRating from '../components/StarRating';
import VoteButtons from '../components/VoteButtons';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [cities, setCities] = useState([]);
  const [filters, setFilters] = useState({
    city_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [filters]);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city_id) params.append('city_id', filters.city_id);
      params.append('page', page);
      params.append('limit', 12);
      
      const response = await axios.get(`${API_URL}/posts?${params.toString()}`);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchPosts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `€${parseFloat(price).toFixed(2)}`;
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
    <div>
      <h1 style={{ marginBottom: '1.5rem', color: '#333' }}>Your Local Marketplace</h1>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>City</label>
          <select 
            value={filters.city_id} 
            onChange={(e) => handleFilterChange('city_id', e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3>No posts found</h3>
          <p>Try adjusting your filters or be the first to create a post!</p>
        </div>
      ) : (
        <>
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card" style={{ cursor: 'default' }}>
                <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="post-image" loading="lazy" />
                  ) : (
                    <div className="post-image" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#999',
                      fontSize: '0.9rem'
                    }}>
                      No Image
                    </div>
                  )}
                </Link>
                <div className="post-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                      <h3 className="post-title" style={{ margin: 0 }}>{post.title}</h3>
                    </Link>
                    <VoteButtons contentType="post" contentId={post.id} size="small" />
                  </div>
                  <div className="post-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      👤 {post.username}
                      <StarRating 
                        rating={post.user_rating || 0} 
                        count={post.rating_count || 0} 
                        size="small" 
                      />
                    </span>
                    <span>📍 {post.city_name} • {formatDate(post.created_at)}</span>
                  </div>
                  {post.price && <div className="post-price">{formatPrice(post.price)}</div>}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    {post.view_count > 0 && (
                      <span>👁️ {post.view_count}</span>
                    )}
                    {post.comment_count > 0 && (
                      <span>💬 {post.comment_count}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: pagination.hasPrevPage ? '#fff' : '#f5f5f5',
                  color: pagination.hasPrevPage ? '#333' : '#999',
                  cursor: pagination.hasPrevPage ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                ← Previous
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show first, last, current, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: '1px solid',
                          borderColor: pageNum === pagination.currentPage ? '#ff6f0f' : '#ddd',
                          borderRadius: '6px',
                          background: pageNum === pagination.currentPage ? '#ff6f0f' : '#fff',
                          color: pageNum === pagination.currentPage ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: pageNum === pagination.currentPage ? 'bold' : 'normal',
                          minWidth: '40px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === pagination.currentPage - 2 ||
                    pageNum === pagination.currentPage + 2
                  ) {
                    return <span key={pageNum} style={{ padding: '0.5rem 0.25rem', color: '#999' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  background: pagination.hasNextPage ? '#fff' : '#f5f5f5',
                  color: pagination.hasNextPage ? '#333' : '#999',
                  cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed',
                  fontWeight: '500'
                }}
              >
                Next →
              </button>
            </div>
          )}

          {/* Results info */}
          <div style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Showing {posts.length} of {pagination.totalCount} listings
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
