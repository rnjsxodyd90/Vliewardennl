import React from 'react';

// Skeleton base component
const Skeleton = ({ className = '', style = {} }) => (
  <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
);

// Post card skeleton
export const PostCardSkeleton = () => (
  <div className="skeleton-card" aria-label="Loading post">
    <div className="skeleton skeleton-image" />
    <div className="skeleton-content">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text short" />
      <div className="skeleton skeleton-price" />
    </div>
  </div>
);

// Post grid skeleton (multiple cards)
export const PostGridSkeleton = ({ count = 8 }) => (
  <div className="posts-grid" aria-busy="true" aria-label="Loading posts">
    {Array.from({ length: count }).map((_, index) => (
      <PostCardSkeleton key={index} />
    ))}
  </div>
);

// Article card skeleton
export const ArticleCardSkeleton = () => (
  <div className="skeleton-card article-card" style={{ flexDirection: 'row' }} aria-label="Loading article">
    <div className="skeleton" style={{ width: '240px', height: '180px', flexShrink: 0 }} />
    <div className="skeleton-content" style={{ flex: 1, padding: 'var(--space-6)' }}>
      <div className="skeleton" style={{ width: '80px', height: '16px', marginBottom: 'var(--space-3)' }} />
      <div className="skeleton skeleton-title" style={{ width: '90%' }} />
      <div className="skeleton skeleton-text" style={{ marginTop: 'var(--space-3)' }} />
      <div className="skeleton skeleton-text short" />
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        <div className="skeleton" style={{ width: '100px', height: '14px' }} />
        <div className="skeleton" style={{ width: '80px', height: '14px' }} />
      </div>
    </div>
  </div>
);

// Article list skeleton
export const ArticleListSkeleton = ({ count = 5 }) => (
  <div className="articles-list" aria-busy="true" aria-label="Loading articles">
    {Array.from({ length: count }).map((_, index) => (
      <ArticleCardSkeleton key={index} />
    ))}
  </div>
);

// Post detail skeleton
export const PostDetailSkeleton = () => (
  <div className="post-detail" aria-busy="true" aria-label="Loading post details">
    <div className="post-detail-header">
      <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: 'var(--radius-lg)' }} />
      <div className="post-detail-info">
        <div className="skeleton" style={{ width: '60%', height: '40px', marginBottom: 'var(--space-4)' }} />
        <div className="skeleton" style={{ width: '40%', height: '36px', marginBottom: 'var(--space-4)' }} />
        <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ width: '80%', height: '16px', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ width: '60%', height: '16px' }} />
      </div>
    </div>
    <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
      <div className="skeleton" style={{ width: '150px', height: '28px', marginBottom: 'var(--space-4)' }} />
      <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ width: '100%', height: '16px', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ width: '90%', height: '16px', marginBottom: 'var(--space-2)' }} />
      <div className="skeleton" style={{ width: '70%', height: '16px' }} />
    </div>
  </div>
);

// Comment skeleton
export const CommentSkeleton = () => (
  <div className="comment" aria-label="Loading comment">
    <div className="comment-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: '100px', height: '16px' }} />
      </div>
      <div className="skeleton" style={{ width: '80px', height: '14px' }} />
    </div>
    <div className="skeleton" style={{ width: '100%', height: '16px', marginTop: 'var(--space-3)' }} />
    <div className="skeleton" style={{ width: '80%', height: '16px', marginTop: 'var(--space-2)' }} />
  </div>
);

// Comments section skeleton
export const CommentsSkeleton = ({ count = 3 }) => (
  <div className="comments-section" aria-busy="true" aria-label="Loading comments">
    <div className="skeleton" style={{ width: '150px', height: '28px', marginBottom: 'var(--space-6)' }} />
    {Array.from({ length: count }).map((_, index) => (
      <CommentSkeleton key={index} />
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton = () => (
  <div className="form-container" aria-busy="true" aria-label="Loading form">
    <div className="skeleton" style={{ width: '200px', height: '32px', margin: '0 auto var(--space-6)' }} />
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} style={{ marginBottom: 'var(--space-5)' }}>
        <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: 'var(--space-2)' }} />
        <div className="skeleton" style={{ width: '100%', height: '48px' }} />
      </div>
    ))}
    <div className="skeleton" style={{ width: '100%', height: '48px', marginTop: 'var(--space-4)' }} />
  </div>
);

// Text skeleton
export const TextSkeleton = ({ lines = 3, lastLineWidth = '60%' }) => (
  <div aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className="skeleton"
        style={{
          width: index === lines - 1 ? lastLineWidth : '100%',
          height: '16px',
          marginBottom: index < lines - 1 ? 'var(--space-2)' : 0
        }}
      />
    ))}
  </div>
);

// Loading spinner component
export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: '24px',
    md: '40px',
    lg: '56px'
  };

  return (
    <div className="loading" role="status" aria-live="polite">
      <div
        className="loading-spinner"
        style={{ width: sizes[size], height: sizes[size] }}
        aria-hidden="true"
      />
      {text && <p className="loading-text">{text}</p>}
      <span className="sr-only">{text}</span>
    </div>
  );
};

export default Skeleton;
