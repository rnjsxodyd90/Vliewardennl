import React from 'react';

const StarRating = ({ rating, count, size = 'medium', showCount = true }) => {
  const displayRating = rating ? rating.toFixed(1) : '0.0';
  
  const fontSize = size === 'small' ? '0.75rem' : size === 'large' ? '1rem' : '0.875rem';

  return (
    <span className="star-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ 
        fontSize, 
        color: numRating >= 4 ? '#28a745' : numRating >= 3 ? '#ffc107' : numRating > 0 ? '#dc3545' : '#999',
        fontWeight: '600'
      }}>
        {displayRating}/5
      </span>
      {showCount && count !== undefined && (
        <span style={{ 
          fontSize, 
          color: '#666' 
        }}>
          ({count} {count === 1 ? 'rating' : 'ratings'})
        </span>
      )}
    </span>
  );
};

export default StarRating;
