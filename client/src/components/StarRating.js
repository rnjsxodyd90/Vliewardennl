import React from 'react';

const StarRating = ({ rating, count, size = 'medium', showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSize = size === 'small' ? '14px' : size === 'large' ? '24px' : '18px';

  const starStyle = {
    fontSize: starSize,
    marginRight: '1px'
  };

  return (
    <span className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ display: 'inline-flex' }}>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} style={{ ...starStyle, color: '#FFB800' }}>★</span>
        ))}
        {hasHalfStar && (
          <span style={{ ...starStyle, color: '#FFB800', position: 'relative' }}>
            <span style={{ position: 'absolute', overflow: 'hidden', width: '50%' }}>★</span>
            <span style={{ color: '#ddd' }}>★</span>
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} style={{ ...starStyle, color: '#ddd' }}>★</span>
        ))}
      </span>
      {showCount && count !== undefined && (
        <span style={{ 
          fontSize: size === 'small' ? '0.75rem' : '0.875rem', 
          color: '#666' 
        }}>
          ({count})
        </span>
      )}
    </span>
  );
};

export default StarRating;


