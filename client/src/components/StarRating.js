import React from 'react';

const StarRating = ({ upvotes = 0, downvotes = 0, size = 'medium', showCount = true }) => {
  const numUpvotes = parseInt(upvotes) || 0;
  const numDownvotes = parseInt(downvotes) || 0;
  const voteScore = numUpvotes - numDownvotes;
  const totalVotes = numUpvotes + numDownvotes;
  
  // Calculate temperature: base 36.5°C + (vote score * 0.01), rounded to nearest 0.1
  const baseTemp = 36.5;
  const warmthChange = voteScore * 0.01;
  const temperature = Math.round((baseTemp + warmthChange) * 10) / 10;
  const displayTemp = temperature.toFixed(1);
  
  const fontSize = size === 'small' ? '0.75rem' : size === 'large' ? '1rem' : '0.875rem';
  
  // Color based on temperature
  // Below 36.5 = cold (got more downvotes)
  // 36.5 = neutral (new/balanced)
  // Above 36.5 = warm (got more upvotes)
  const getTemperatureColor = (temp) => {
    if (temp < 36.0) return '#3b82f6';    // Very cold (blue)
    if (temp < 36.5) return '#60a5fa';    // Cold (light blue)
    if (temp === 36.5) return '#8899a6';  // Neutral (gray)
    if (temp < 37.0) return '#17a2b8';    // Warming up (teal)
    if (temp < 37.5) return '#fd7e14';    // Warm (orange)
    if (temp < 38.0) return '#e85d04';    // Hot (deeper orange)
    return '#dc3545';                      // Very hot (red)
  };
  
  // Get icon based on temperature
  const getThermometerIcon = (temp) => {
    if (temp < 36.0) return '🥶';
    if (temp < 36.5) return '❄️';
    if (temp === 36.5) return '🌡️';
    if (temp < 37.5) return '🔥';
    return '🔥';
  };

  const color = getTemperatureColor(temperature);
  const icon = getThermometerIcon(temperature);

  return (
    <span className="temperature-rating" style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '12px',
      background: `${color}15`,
    }}>
      <span style={{ fontSize: size === 'small' ? '0.7rem' : '0.9rem' }}>
        {icon}
      </span>
      <span style={{ 
        fontSize, 
        color: color,
        fontWeight: '600',
        fontFamily: 'monospace'
      }}>
        {displayTemp}°C
      </span>
      {showCount && totalVotes > 0 && (
        <span style={{ 
          fontSize: size === 'small' ? '0.65rem' : '0.75rem', 
          color: '#666',
          marginLeft: '2px'
        }}>
          ({voteScore >= 0 ? '+' : ''}{voteScore})
        </span>
      )}
    </span>
  );
};

export default StarRating;
