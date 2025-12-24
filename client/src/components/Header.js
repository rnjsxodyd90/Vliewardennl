import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Vliewardennl
        </Link>
        <nav className="header-nav">
          <Link to="/">Home</Link>
          {user ? (
            <>
              <Link to="/create">Create Post</Link>
              <span>Welcome, {user.username}</span>
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

