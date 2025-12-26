import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Community from './pages/Community';
import ArticleDetail from './pages/ArticleDetail';
import CreateArticle from './pages/CreateArticle';
import EditArticle from './pages/EditArticle';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Moderation from './pages/Moderation';
import HowItWorks from './pages/HowItWorks';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const ModeratorRoute = ({ children }) => {
  const { user, isModerator } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isModerator) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              {/* Marketplace routes */}
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/create" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
              <Route path="/edit/:id" element={<PrivateRoute><EditPost /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              
              {/* Community routes */}
              <Route path="/community" element={<Community />} />
              <Route path="/community/:id" element={<ArticleDetail />} />
              <Route path="/community/create" element={<PrivateRoute><CreateArticle /></PrivateRoute>} />
              <Route path="/community/edit/:id" element={<PrivateRoute><EditArticle /></PrivateRoute>} />
              
              {/* Moderation routes */}
              <Route path="/moderation" element={<ModeratorRoute><Moderation /></ModeratorRoute>} />
              
              {/* Info pages */}
              <Route path="/how-it-works" element={<HowItWorks />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
