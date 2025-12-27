import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Header = () => {
  const { user, logout, isModerator } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const NavLink = ({ to, children, checkActive, showBadge, badgeCount }) => (
    <Link
      to={to}
      className={checkActive ? 'active' : ''}
      style={{
        fontWeight: checkActive ? 'bold' : 'normal',
        position: showBadge ? 'relative' : 'static'
      }}
      aria-current={checkActive ? 'page' : undefined}
    >
      {children}
      {showBadge && badgeCount > 0 && (
        <span
          className="notification-badge"
          aria-label={`${badgeCount} unread messages`}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  );

  return (
    <header className="header" role="banner">
      <div className="header-content">
        <Link
          to="/"
          className="logo"
          style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}
          aria-label="Vliewarden NL - Home"
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Vliewarden NL</span>
          <span
            style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 'normal' }}
            className="hidden-mobile"
          >
            Made by and for expats in the Netherlands
          </span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn hidden-desktop"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="header-nav"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span style={{ fontSize: '1.5rem' }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </span>
        </button>

        <nav
          id="header-nav"
          className={`header-nav ${mobileMenuOpen ? 'open' : ''}`}
          role="navigation"
          aria-label="Main navigation"
        >
          <NavLink
            to="/"
            checkActive={isActive('/') && !isActive('/community')}
          >
            Marketplace
          </NavLink>

          <NavLink
            to="/community"
            checkActive={isActive('/community')}
          >
            Community
          </NavLink>

          <NavLink
            to="/how-it-works"
            checkActive={isActive('/how-it-works')}
          >
            How it Works
          </NavLink>

          {user ? (
            <>
              <Link to="/create" className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'white' }}>
                + Sell
              </Link>

              <NavLink
                to="/dashboard"
                checkActive={isActive('/dashboard')}
              >
                Dashboard
              </NavLink>

              <NavLink
                to="/messages"
                checkActive={isActive('/messages')}
                showBadge={true}
                badgeCount={unreadCount}
              >
                Messages
              </NavLink>

              {isModerator && (
                <NavLink
                  to="/moderation"
                  checkActive={isActive('/moderation')}
                >
                  <span aria-hidden="true">🛡️</span> Mod
                </NavLink>
              )}

              <span style={{ opacity: 0.8, padding: '0.5rem' }} aria-label={`Logged in as ${user.username}`}>
                {user.username}
              </span>

              <button
                onClick={logout}
                className="btn btn-sm btn-outline"
                style={{ color: 'white', borderColor: 'white' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-ghost" style={{ color: 'white' }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'white' }}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
