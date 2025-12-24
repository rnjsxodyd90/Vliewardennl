import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const EditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city_id: '',
    category_id: '',
    price: '',
    image_url: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCities();
    fetchCategories();
    fetchPost();
  }, [user, navigate, id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts/${id}`);
      const post = response.data;
      
      if (post.user_id !== user.id) {
        navigate('/');
        return;
      }

      setFormData({
        title: post.title || '',
        description: post.description || '',
        city_id: post.city_id || '',
        category_id: post.category_id || '',
        price: post.price || '',
        image_url: post.image_url || '',
        status: post.status || 'active'
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/');
    } finally {
      setFetching(false);
    }
  };

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
    
    if (!formData.city_id) {
      newErrors.city_id = 'City is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
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
      const payload = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null
      };
      
      await axios.put(`${API_URL}/posts/${id}`, payload);
      navigate(`/post/${id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update post';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="form-container">
      <h1 style={{ marginBottom: '1.5rem' }}>Edit Post</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter post title"
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your item or service..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="city_id">City *</label>
          <select
            id="city_id"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
          >
            <option value="">Select a city</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          {errors.city_id && <div className="error-message">{errors.city_id}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Category *</label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.type})
              </option>
            ))}
          </select>
          {errors.category_id && <div className="error-message">{errors.category_id}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (€)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.price && <div className="error-message">{errors.price}</div>}
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

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Post'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate(`/post/${id}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;

