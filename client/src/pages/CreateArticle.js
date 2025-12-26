import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreateArticle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    city_id: '',
    image_url: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCities();
  }, [user, navigate]);

  const fetchCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/cities`);
      setCities(response.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }
    
    if (!formData.city_id) {
      newErrors.city_id = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/articles`, formData);
      navigate(`/community/${response.data.id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create article';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 style={{ marginBottom: '1.5rem' }}>Write an Article</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Give your article a title"
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="content">Content *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Share your thoughts, news, or experiences with the community..."
            style={{ minHeight: '200px' }}
          />
          {errors.content && <div className="error-message">{errors.content}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="city_id">City *</label>
          <select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
          >
            <option value="">Select your city</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          {errors.city_id && <div className="error-message">{errors.city_id}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="image_url">Image URL (optional)</label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Article'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/community')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateArticle;



