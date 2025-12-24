import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

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
                📊 Dashboard
              </Link>
              <span style={{ opacity: 0.8 }}>👤 {user.username}</span>
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
