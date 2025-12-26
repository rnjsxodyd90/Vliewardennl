import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    soldPosts: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserPosts();
  }, [user, navigate]);

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/posts?user_id=${user.id}&limit=100`);
      const userPosts = response.data.posts;
      setPosts(userPosts);
      
      // Calculate stats
      const totalViews = userPosts.reduce((sum, p) => sum + (p.view_count || 0), 0);
      setStats({
        totalPosts: userPosts.length,
        activePosts: userPosts.filter(p => p.status === 'active').length,
        soldPosts: userPosts.filter(p => p.status === 'sold').length,
        totalViews
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/posts/${postId}`);
      fetchUserPosts();
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      await axios.put(`${API_URL}/posts/${postId}`, { status: newStatus });
      fetchUserPosts();
    } catch (error) {
      alert('Failed to update post status');
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

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `€${parseFloat(price).toFixed(2)}`;
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    return post.status === activeTab;
  });

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>My Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>Welcome back, {user?.username}!</p>
        </div>
        <Link to="/create" className="btn btn-primary">
          + Create New Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalPosts}</div>
          <div style={{ opacity: 0.9 }}>Total Listings</div>
        </div>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.activePosts}</div>
          <div style={{ opacity: 0.9 }}>Active</div>
        </div>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.soldPosts}</div>
          <div style={{ opacity: 0.9 }}>Sold</div>
        </div>
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalViews}</div>
          <div style={{ opacity: 0.9 }}>Total Views</div>
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
        {[
          { key: 'all', label: 'All', count: stats.totalPosts },
          { key: 'active', label: 'Active', count: stats.activePosts },
          { key: 'sold', label: 'Sold', count: stats.soldPosts },
          { key: 'closed', label: 'Closed', count: posts.filter(p => p.status === 'closed').length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: activeTab === tab.key ? '#ff6f0f' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#666',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? '600' : '400',
              fontSize: '0.95rem'
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem' }}>
          <h3>No listings found</h3>
          <p>
            {activeTab === 'all' 
              ? "You haven't created any listings yet."
              : `You don't have any ${activeTab} listings.`
            }
          </p>
          <Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #eee',
                alignItems: 'center'
              }}
            >
              {/* Image */}
              <Link to={`/post/${post.id}`}>
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt={post.title} 
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    background: '#f0f0f0',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '0.8rem'
                  }}>
                    No Image
                  </div>
                )}
              </Link>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <Link to={`/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{post.title}</h3>
                </Link>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                  {post.category_name || 'Uncategorized'} • {post.city_name}{post.district_name ? `, ${post.district_name}` : ''}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888' }}>
                  {formatDate(post.created_at)} • {post.view_count || 0} views • {post.comment_count || 0} comments
                </div>
              </div>

              {/* Price */}
              <div style={{ 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                color: '#ff6f0f',
                minWidth: '100px',
                textAlign: 'right'
              }}>
                {formatPrice(post.price)}
              </div>

              {/* Status Badge */}
              <div style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                background: post.status === 'active' ? '#d4edda' : 
                           post.status === 'sold' ? '#cce5ff' : '#f8d7da',
                color: post.status === 'active' ? '#155724' : 
                       post.status === 'sold' ? '#004085' : '#721c24',
                minWidth: '70px',
                textAlign: 'center'
              }}>
                {post.status.toUpperCase()}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link 
                  to={`/edit/${post.id}`}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#f8f9fa',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: '#333',
                    fontSize: '0.875rem'
                  }}
                >
                  Edit
                </Link>
                {post.status === 'active' && (
                  <button
                    onClick={() => handleStatusChange(post.id, 'sold')}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#28a745',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Mark Sold
                  </button>
                )}
                <button
                  onClick={() => handleDelete(post.id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: '#dc3545',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

