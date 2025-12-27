import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import VoteButtons from '../components/VoteButtons';

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
            <div key={article.id} className="article-card" style={{ cursor: 'default' }}>
              {article.image_url && (
                <Link to={`/community/${article.id}`}>
                  <img src={article.image_url} alt={article.title} className="article-image" />
                </Link>
              )}
              <div className="article-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <Link to={`/community/${article.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <h2 className="article-title">{article.title}</h2>
                  </Link>
                  <VoteButtons contentType="article" contentId={article.id} size="small" />
                </div>
                <Link to={`/community/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <p className="article-excerpt">{truncateContent(article.content)}</p>
                </Link>
                <div className="article-meta">
                  <Link
                    to={`/user/${article.username}`}
                    style={{ color: '#667eea', textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {article.username}
                  </Link>
                  <span>{article.city_name}</span>
                  <span>{formatDate(article.created_at)}</span>
                  {article.comment_count > 0 && (
                    <span>{article.comment_count} comments</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
