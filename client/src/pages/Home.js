import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    city_id: '',
    category_id: '',
    type: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city_id) params.append('city_id', filters.city_id);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.type) params.append('type', filters.type);
      
      const response = await axios.get(`${API_URL}/posts?${params.toString()}`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
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
      day: 'numeric' 
    });
  };

  const goodsCategories = categories.filter(c => c.type === 'goods');
  const servicesCategories = categories.filter(c => c.type === 'services');

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

        <div className="filter-group">
          <label>Type</label>
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="goods">Goods</option>
            <option value="services">Services</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select 
            value={filters.category_id} 
            onChange={(e) => handleFilterChange('category_id', e.target.value)}
          >
            <option value="">All Categories</option>
            {filters.type === 'goods' && goodsCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            {filters.type === 'services' && servicesCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            {!filters.type && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
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
        <div className="posts-grid">
          {posts.map(post => (
            <Link key={post.id} to={`/post/${post.id}`} className="post-card">
              {post.image_url ? (
                <img src={post.image_url} alt={post.title} className="post-image" />
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
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <div className="post-meta">
                  {post.city_name} • {post.category_name} • {formatDate(post.created_at)}
                </div>
                {post.price && <div className="post-price">{formatPrice(post.price)}</div>}
                {post.comment_count > 0 && (
                  <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

