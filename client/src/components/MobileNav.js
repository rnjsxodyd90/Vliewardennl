import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/',
      icon: '🏠',
      label: 'Home',
      checkActive: () => isActive('/') && !isActive('/community')
    },
    {
      path: '/community',
      icon: '👥',
      label: 'Community',
      checkActive: () => isActive('/community')
    },
    {
      path: user ? '/create' : '/login',
      icon: '➕',
      label: 'Sell',
      checkActive: () => isActive('/create')
    },
    {
      path: user ? '/messages' : '/login',
      icon: '💬',
      label: 'Messages',
      checkActive: () => isActive('/messages'),
      authRequired: true
    },
    {
      path: user ? '/dashboard' : '/login',
      icon: '👤',
      label: user ? 'Profile' : 'Login',
      checkActive: () => isActive('/dashboard') || isActive('/login')
    }
  ];

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Mobile navigation">
      <div className="mobile-nav-inner">
        {navItems.map((item) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={`mobile-nav-item ${item.checkActive() ? 'active' : ''}`}
            aria-current={item.checkActive() ? 'page' : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
