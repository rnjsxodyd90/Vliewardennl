import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ArticleComments from '../components/ArticleComments';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await axios.get(`${API_URL}/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      setError('Article not found');
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/articles/${id}`);
      navigate('/community');
    } catch (error) {
      alert('Failed to delete article');
    }
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

  if (loading) {
    return <div className="loading">Loading article...</div>;
  }

  if (error || !article) {
    return (
      <div className="empty-state">
        <h3>{error || 'Article not found'}</h3>
        <button onClick={() => navigate('/community')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Community
        </button>
      </div>
    );
  }

  const isOwner = user && user.id === article.user_id;

  return (
    <div>
      <div className="article-detail">
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="article-detail-image" />
        )}
        
        <h1 className="article-detail-title">{article.title}</h1>
        
        <div className="article-detail-meta">
          <span>👤 {article.username}</span>
          <span>📍 {article.city_name}, {article.province}</span>
          <span>📅 {formatDate(article.created_at)}</span>
        </div>

        {isOwner && (
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              onClick={() => navigate(`/community/edit/${article.id}`)} 
              className="btn btn-secondary"
              style={{ marginRight: '0.5rem' }}
            >
              Edit
            </button>
            <button 
              onClick={handleDelete}
              className="btn btn-secondary"
              style={{ background: '#dc3545' }}
            >
              Delete
            </button>
          </div>
        )}

        <div className="article-detail-content">
          {article.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      <ArticleComments articleId={id} />
    </div>
  );
};

export default ArticleDetail;

