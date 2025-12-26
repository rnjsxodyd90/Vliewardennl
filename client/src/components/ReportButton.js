import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const REASONS = [
  { value: 'spam', label: '🚫 Spam' },
  { value: 'harassment', label: '😠 Harassment' },
  { value: 'inappropriate', label: '⚠️ Inappropriate Content' },
  { value: 'scam', label: '💰 Scam / Fraud' },
  { value: 'non_english', label: '🌐 Not in English' },
  { value: 'other', label: '📝 Other' }
];

const ReportButton = ({ contentType, contentId, size = 'small' }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/moderation/reports`, {
        content_type: contentType,
        content_id: contentId,
        reason,
        description: description.trim() || null
      });
      
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setReason('');
        setDescription('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = size === 'small' ? {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#666',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  } : {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    background: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#666',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={buttonStyle}
        title="Report this content"
      >
        🚩 {size !== 'small' && 'Report'}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '100%',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                <h3 style={{ color: '#28a745' }}>Report Submitted</h3>
                <p style={{ color: '#666' }}>Thank you for helping keep our community safe.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>🚩 Report Content</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Why are you reporting this?
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {REASONS.map(r => (
                        <label
                          key={r.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid',
                            borderColor: reason === r.value ? '#ff6f0f' : '#ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: reason === r.value ? '#fff5f0' : 'white'
                          }}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={(e) => setReason(e.target.value)}
                            style={{ display: 'none' }}
                          />
                          <span style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: reason === r.value ? '#ff6f0f' : '#ddd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {reason === r.value && (
                              <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#ff6f0f'
                              }} />
                            )}
                          </span>
                          {r.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Additional details (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more context about this report..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '80px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{ 
                      color: '#dc3545', 
                      marginBottom: '1rem',
                      padding: '0.5rem',
                      background: '#f8d7da',
                      borderRadius: '4px'
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#f8f9fa',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !reason}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: loading || !reason ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading || !reason ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;

