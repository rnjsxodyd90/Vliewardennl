import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Header = () => {
  const { user, logout, isModerator } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/unread-count`);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Vliewarden NL</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 'normal' }}>Made by and for expats in the Netherlands</span>
        </Link>
        <nav className="header-nav">
          <Link 
            to="/" 
            style={{ 
              fontWeight: isActive('/') && !isActive('/community') ? 'bold' : 'normal',
              borderBottom: isActive('/') && !isActive('/community') ? '2px solid white' : 'none'
            }}
          >
            Marketplace
          </Link>
          <Link 
            to="/community"
            style={{ 
              fontWeight: isActive('/community') ? 'bold' : 'normal',
              borderBottom: isActive('/community') ? '2px solid white' : 'none'
            }}
          >
            Community
          </Link>
          <Link 
            to="/how-it-works"
            style={{ 
              fontWeight: isActive('/how-it-works') ? 'bold' : 'normal',
              borderBottom: isActive('/how-it-works') ? '2px solid white' : 'none'
            }}
          >
            How it Works
          </Link>
          {user ? (
            <>
              <Link to="/create">Sell</Link>
              <Link
                to="/dashboard"
                style={{
                  fontWeight: isActive('/dashboard') ? 'bold' : 'normal',
                  borderBottom: isActive('/dashboard') ? '2px solid white' : 'none'
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/messages"
                style={{
                  fontWeight: isActive('/messages') ? 'bold' : 'normal',
                  borderBottom: isActive('/messages') ? '2px solid white' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative'
                }}
              >
                Messages
                {unreadCount > 0 && (
                  <span style={{
                    background: '#dc3545',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              {isModerator && (
                <Link 
                  to="/moderation"
                  style={{ 
                    fontWeight: isActive('/moderation') ? 'bold' : 'normal',
                    borderBottom: isActive('/moderation') ? '2px solid white' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🛡️ Mod
                </Link>
              )}
              <span style={{ opacity: 0.8 }}>{user.username}</span>
              <button onClick={logout} className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
