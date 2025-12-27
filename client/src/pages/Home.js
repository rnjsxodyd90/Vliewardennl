import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StarRating from '../components/StarRating';
import VoteButtons from '../components/VoteButtons';
import { PostGridSkeleton } from '../components/Skeleton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    city_id: '',
    district_id: '',
    category_id: '',
    search: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    fetchCities();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (filters.city_id) {
      fetchDistricts(filters.city_id);
    } else {
      setDistricts([]);
      if (filters.district_id) {
        setFilters(prev => ({ ...prev, district_id: '' }));
      }
    }
  }, [filters.city_id]);

  useEffect(() => {
    fetchPosts(1);
  }, [filters]);

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

  const fetchPosts = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.city_id) params.append('city_id', filters.city_id);
      if (filters.district_id) params.append('district_id', filters.district_id);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.search) params.append('search', filters.search);
      params.append('page', page);
      params.append('limit', 12);

      const response = await axios.get(`${API_URL}/posts?${params.toString()}`);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const clearFilters = () => {
    setFilters({ city_id: '', district_id: '', category_id: '', search: '' });
    setSearchInput('');
    setDistricts([]);
  };

  const handlePageChange = (newPage) => {
    fetchPosts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `€${parseFloat(price).toFixed(2)}`;
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

  const hasActiveFilters = filters.city_id || filters.district_id || filters.category_id || filters.search;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Your Local Marketplace</h1>
        <p className="page-subtitle">Buy and sell with expats in the Netherlands</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search listings..."
              className="form-group"
              style={{
                width: '100%',
                padding: 'var(--space-4)',
                paddingLeft: 'var(--space-12)',
                border: '2px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-base)',
                transition: 'all var(--transition-fast)',
                background: 'var(--bg-primary)'
              }}
              aria-label="Search listings"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </div>
      </form>

      {/* Category Pills */}
      <div
        className="flex gap-2 mb-4"
        style={{ flexWrap: 'wrap' }}
        role="group"
        aria-label="Filter by category"
      >
        <button
          onClick={() => handleFilterChange('category_id', '')}
          className={`btn btn-sm ${!filters.category_id ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            borderRadius: 'var(--radius-full)',
            border: !filters.category_id ? 'none' : '1px solid var(--border-default)'
          }}
          aria-pressed={!filters.category_id}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleFilterChange('category_id', cat.id.toString())}
            className={`btn btn-sm ${filters.category_id === cat.id.toString() ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              borderRadius: 'var(--radius-full)',
              border: filters.category_id === cat.id.toString() ? 'none' : '1px solid var(--border-default)'
            }}
            aria-pressed={filters.category_id === cat.id.toString()}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Location Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label htmlFor="city-filter">City</label>
          <select
            id="city-filter"
            value={filters.city_id}
            onChange={(e) => handleFilterChange('city_id', e.target.value)}
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>
        {districts.length > 0 && (
          <div className="filter-group">
            <label htmlFor="district-filter">District</label>
            <select
              id="district-filter"
              value={filters.district_id}
              onChange={(e) => handleFilterChange('district_id', e.target.value)}
              aria-label="Filter by district"
            >
              <option value="">All Districts</option>
              {districts.map(district => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>
        )}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-ghost btn-sm"
            aria-label="Clear all filters"
          >
            <span aria-hidden="true">✕</span> Clear Filters
          </button>
        )}
      </div>

      {/* Active filters indicator */}
      {filters.search && (
        <div className="alert alert-info mb-4">
          <span className="alert-icon" aria-hidden="true">🔍</span>
          <span>Searching for: <strong>"{filters.search}"</strong></span>
        </div>
      )}

      {/* Posts Grid */}
      {loading ? (
        <PostGridSkeleton count={8} />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">📦</div>
          <h3>No posts found</h3>
          <p>Try adjusting your filters or be the first to create a post!</p>
          <Link to="/create" className="btn btn-primary">
            Create a Post
          </Link>
        </div>
      ) : (
        <>
          <div className="posts-grid stagger-animation">
            {posts.map(post => (
              <article
                key={post.id}
                className="post-card animate-fade-in-up"
                style={{ cursor: 'default' }}
              >
                <Link
                  to={`/post/${post.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  aria-label={`View ${post.title}`}
                >
                  <div className="post-image-container">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="post-image"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="post-image"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          fontSize: 'var(--text-sm)'
                        }}
                        aria-hidden="true"
                      >
                        No Image
                      </div>
                    )}
                    {post.category_name && (
                      <span className="post-badge">{post.category_name}</span>
                    )}
                  </div>
                </Link>
                <div className="post-content">
                  <div className="flex justify-between items-center" style={{ gap: 'var(--space-2)' }}>
                    <Link
                      to={`/post/${post.id}`}
                      style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                    >
                      <h3 className="post-title">{post.title}</h3>
                    </Link>
                    <VoteButtons contentType="post" contentId={post.id} size="small" />
                  </div>
                  <div className="post-meta">
                    <span className="post-meta-item">
                      <Link
                        to={`/user/${post.username}`}
                        style={{ color: 'var(--color-secondary)', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {post.username}
                      </Link>
                      <StarRating
                        upvotes={post.user_upvotes || 0}
                        downvotes={post.user_downvotes || 0}
                        size="small"
                      />
                    </span>
                  </div>
                  <div className="post-meta">
                    <span>
                      {post.city_name}{post.district_name ? `, ${post.district_name}` : ''}
                    </span>
                    <span>•</span>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  {post.price && (
                    <div className="post-price">{formatPrice(post.price)}</div>
                  )}
                  <div className="post-footer">
                    {post.view_count > 0 && (
                      <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                        👁 {post.view_count}
                      </span>
                    )}
                    {post.comment_count > 0 && (
                      <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                        💬 {post.comment_count}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="pagination-btn"
                aria-label="Previous page"
              >
                ← Previous
              </button>

              <div className="flex gap-1">
                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === pagination.totalPages ||
                    (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-btn ${pageNum === pagination.currentPage ? 'active' : ''}`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={pageNum === pagination.currentPage ? 'page' : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === pagination.currentPage - 2 ||
                    pageNum === pagination.currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="pagination-ellipsis" aria-hidden="true">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="pagination-btn"
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}

          {/* Results info */}
          <p className="text-center text-muted mt-4" style={{ fontSize: 'var(--text-sm)' }}>
            Showing {posts.length} of {pagination.totalCount} listings
          </p>
        </>
      )}
    </div>
  );
};

export default Home;
