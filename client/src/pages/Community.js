import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Community = () => {
  const [articles, setArticles] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [cityFilter]);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityFilter) params.append('city_id', cityFilter);
      
      const response = await axios.get(`${API_URL}/articles?${params.toString()}`);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
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

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#333', margin: 0 }}>Community</h1>
        <Link to="/community/create" className="btn btn-primary">
          Write Article
        </Link>
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>City</label>
          <select 
            value={cityFilter} 
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Be the first to share something with your community!</p>
        </div>
      ) : (
        <div className="articles-list">
          {articles.map(article => (
            <Link key={article.id} to={`/community/${article.id}`} className="article-card">
              {article.image_url && (
                <img src={article.image_url} alt={article.title} className="article-image" />
              )}
              <div className="article-content">
                <h2 className="article-title">{article.title}</h2>
                <p className="article-excerpt">{truncateContent(article.content)}</p>
                <div className="article-meta">
                  <span>👤 {article.username}</span>
                  <span>📍 {article.city_name}</span>
                  <span>📅 {formatDate(article.created_at)}</span>
                  {article.comment_count > 0 && (
                    <span>💬 {article.comment_count}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;

