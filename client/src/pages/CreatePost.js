import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city_id: '',
    district_id: '',
    price: '',
    image_url: '',
    category_id: '',
    pay_type: '',
    location: '',
    work_days: '',
    start_time: '',
    end_time: '',
    contact_email: '',
    contact_phone: '',
    contact_whatsapp: '',
    show_contact_info: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCities();
    fetchCategories();
  }, [user, navigate]);

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

  const fetchDistricts = async (cityId) => {
    try {
      const response = await axios.get(`${API_URL}/districts?city_id=${cityId}`);
      setDistricts(response.data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fetch districts when city changes
    if (name === 'city_id') {
      if (value) {
        fetchDistricts(value);
      } else {
        setDistricts([]);
      }
      setFormData(prev => ({ ...prev, district_id: '' }));
    }
    
    // Clear error for this field
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
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        district_id: formData.district_id ? parseInt(formData.district_id) : null
      };
      
      const response = await axios.post(`${API_URL}/posts`, payload);
      navigate(`/post/${response.data.id}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to create post';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1 style={{ marginBottom: '1.5rem' }}>Create New Post</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What are you selling or offering?"
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
            placeholder="Describe your item or service in detail..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            <label htmlFor="district_id">District</label>
            <select
              id="district_id"
              name="district_id"
              value={formData.district_id}
              onChange={handleChange}
              disabled={!formData.city_id || districts.length === 0}
            >
              <option value="">{formData.city_id ? (districts.length > 0 ? 'Select district' : 'No districts') : 'Select city first'}</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Category</label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (€)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00 (leave empty for 'Price on request')"
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

        <hr style={{ margin: '2rem 0', borderColor: 'var(--color-border)' }} />
        <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>Job Details (Optional)</h3>

        <div className="form-group">
          <label htmlFor="pay_type">Pay Type</label>
          <select
            id="pay_type"
            name="pay_type"
            value={formData.pay_type}
            onChange={handleChange}
          >
            <option value="">Select pay type</option>
            <option value="hourly">Hourly Wage</option>
            <option value="total">Total Pay</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location / Address</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Amsterdam Central, Kalverstraat 100"
          />
        </div>

        <div className="form-group">
          <label htmlFor="work_days">Work Days</label>
          <select
            id="work_days"
            name="work_days"
            value={formData.work_days}
            onChange={handleChange}
          >
            <option value="">Select work schedule</option>
            <option value="Mon-Fri">Monday - Friday</option>
            <option value="Mon-Sat">Monday - Saturday</option>
            <option value="Sat-Sun">Weekends Only</option>
            <option value="Flexible">Flexible Schedule</option>
            <option value="One-time">One-time Job</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="start_time">Start Time</label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="end_time">End Time</label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
            />
          </div>
        </div>

        <hr style={{ margin: '2rem 0', borderColor: 'var(--color-border)' }} />
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Contact Information</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
          Add your contact details so interested buyers can reach you directly.
        </p>

        <div className="form-group">
          <label htmlFor="contact_email">Contact Email</label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            placeholder="your@email.com"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="contact_phone">Phone Number</label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="+31 6 12345678"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_whatsapp">WhatsApp Number</label>
            <input
              type="tel"
              id="contact_whatsapp"
              name="contact_whatsapp"
              value={formData.contact_whatsapp}
              onChange={handleChange}
              placeholder="+31 6 12345678"
            />
          </div>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer',
            margin: 0
          }}>
            <input
              type="checkbox"
              name="show_contact_info"
              checked={formData.show_contact_info}
              onChange={(e) => setFormData(prev => ({ ...prev, show_contact_info: e.target.checked }))}
              style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div>
              <span style={{ fontWeight: '500', color: '#333' }}>
                I agree to show my contact information publicly
              </span>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                By checking this box, you consent to displaying your contact details (email, phone, WhatsApp) on your listing so buyers can reach you directly.
              </p>
            </div>
          </label>
        </div>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Post'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
