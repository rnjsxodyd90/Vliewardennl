import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const REASON_LABELS = {
  spam: '🚫 Spam',
  harassment: '😠 Harassment',
  inappropriate: '⚠️ Inappropriate',
  scam: '💰 Scam',
  other: '📝 Other'
};

const STATUS_COLORS = {
  pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
  reviewed: { bg: '#cce5ff', color: '#004085', label: 'Reviewed' },
  resolved: { bg: '#d4edda', color: '#155724', label: 'Resolved' },
  dismissed: { bg: '#f8d7da', color: '#721c24', label: 'Dismissed' }
};

const Moderation = () => {
  const { user, isModerator, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    if (!isModerator) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isModerator, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        axios.get(`${API_URL}/moderation/stats`),
        axios.get(`${API_URL}/moderation/reports?status=${filterStatus}`)
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);

      if (isAdmin) {
        const usersRes = await axios.get(`${API_URL}/moderation/users`);
        setUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/moderation/reports?status=${filterStatus}`);
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  useEffect(() => {
    if (isModerator) {
      fetchReports();
    }
  }, [filterStatus]);

  const handleViewReport = async (reportId) => {
    try {
      const response = await axios.get(`${API_URL}/moderation/reports/${reportId}`);
      setSelectedReport(response.data);
    } catch (error) {
      console.error('Error fetching report details:', error);
    }
  };

  const handleUpdateReport = async (reportId, status, resolutionNote = '') => {
    try {
      await axios.put(`${API_URL}/moderation/reports/${reportId}`, {
        status,
        resolution_note: resolutionNote
      });
      setSelectedReport(null);
      fetchReports();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update report');
    }
  };

  const handleDeleteContent = async (contentType, contentId) => {
    if (!window.confirm('Are you sure you want to delete this content? This cannot be undone.')) {
      return;
    }

    try {
      const endpoint = contentType === 'article_comment' ? 'article-comments' : `${contentType}s`;
      await axios.delete(`${API_URL}/moderation/${endpoint}/${contentId}`);
      alert('Content deleted successfully');
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete content');
    }
  };

  const handleBanUser = async (userId, reason) => {
    if (!reason) {
      reason = prompt('Enter ban reason:');
      if (!reason) return;
    }

    try {
      await axios.post(`${API_URL}/moderation/users/${userId}/ban`, { reason });
      alert('User banned successfully');
      fetchData();
      if (selectedReport) {
        handleViewReport(selectedReport.id);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unban this user?')) {
      return;
    }

    try {
      await axios.post(`${API_URL}/moderation/users/${userId}/unban`);
      alert('User unbanned successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to unban user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/moderation/users/${userId}/role`, { role: newRole });
      alert('Role updated successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to change role');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isModerator) {
    return null;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>🛡️ Moderation Dashboard</h1>
        <span style={{
          padding: '0.5rem 1rem',
          background: isAdmin ? '#dc3545' : '#6c757d',
          color: 'white',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {isAdmin ? '👑 Admin' : '🛡️ Moderator'}
        </span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffe0a3 100%)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#856404' }}>
              {stats.pendingReports}
            </div>
            <div style={{ color: '#856404' }}>Pending Reports</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #cce5ff 0%, #99c9ff 100%)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#004085' }}>
              {stats.totalReports}
            </div>
            <div style={{ color: '#004085' }}>Total Reports</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#721c24' }}>
              {stats.bannedUsers}
            </div>
            <div style={{ color: '#721c24' }}>Banned Users</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #d4edda 0%, #b8dfc4 100%)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#155724' }}>
              {stats.totalUsers}
            </div>
            <div style={{ color: '#155724' }}>Total Users</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.75rem 1.5rem',
            background: activeTab === 'reports' ? '#ff6f0f' : 'transparent',
            color: activeTab === 'reports' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📋 Reports
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'users' ? '#ff6f0f' : 'transparent',
              color: activeTab === 'users' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            👥 Users
          </button>
        )}
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {/* Filter */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Filter by status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="">All</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: '#f8f9fa',
              borderRadius: '12px',
              color: '#666'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <h3>No reports to review</h3>
              <p>All caught up! Check back later.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reports.map(report => {
                const statusConfig = STATUS_COLORS[report.status];
                return (
                  <div
                    key={report.id}
                    style={{
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s'
                    }}
                    onClick={() => handleViewReport(report.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: statusConfig.bg,
                          color: statusConfig.color,
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginRight: '0.5rem'
                        }}>
                          {statusConfig.label}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          marginRight: '0.5rem'
                        }}>
                          {report.content_type}
                        </span>
                        <span>{REASON_LABELS[report.reason]}</span>
                      </div>
                      <span style={{ color: '#666', fontSize: '0.875rem' }}>
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                    {report.description && (
                      <p style={{ 
                        margin: '0.5rem 0 0', 
                        color: '#666',
                        fontSize: '0.875rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {report.description}
                      </p>
                    )}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#999' }}>
                      Reported by: {report.reporter_username}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users Tab (Admin only) */}
      {activeTab === 'users' && isAdmin && (
        <div>
          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>User</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Role</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Posts</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Joined</th>
                    <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '1rem' }}>
                        <div><strong>{u.username}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          disabled={u.id === user.id}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            background: u.role === 'admin' ? '#dc3545' : u.role === 'moderator' ? '#6c757d' : '#f8f9fa',
                            color: u.role === 'admin' || u.role === 'moderator' ? 'white' : '#333'
                          }}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.is_banned ? (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#f8d7da',
                            color: '#721c24',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            Banned
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: '#d4edda',
                            color: '#155724',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            Active
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>{u.post_count}</td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {formatDate(u.created_at)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {u.id !== user.id && u.role !== 'admin' && (
                          u.is_banned ? (
                            <button
                              onClick={() => handleUnbanUser(u.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(u.id)}
                              style={{
                                padding: '0.25rem 0.75rem',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Ban
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
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
          onClick={() => setSelectedReport(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '1.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
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

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: STATUS_COLORS[selectedReport.status].bg,
                  color: STATUS_COLORS[selectedReport.status].color,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {STATUS_COLORS[selectedReport.status].label}
                </span>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#e0e0e0',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  {selectedReport.content_type}
                </span>
              </div>
              <p><strong>Reason:</strong> {REASON_LABELS[selectedReport.reason]}</p>
              {selectedReport.description && (
                <p><strong>Description:</strong> {selectedReport.description}</p>
              )}
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                Reported by {selectedReport.reporter_username} on {formatDate(selectedReport.created_at)}
              </p>
            </div>

            {/* Reported Content */}
            {selectedReport.content && (
              <div style={{
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem' }}>Reported Content:</h4>
                {selectedReport.content_type === 'user' ? (
                  <div>
                    <p><strong>Username:</strong> {selectedReport.content.username}</p>
                    <p><strong>Email:</strong> {selectedReport.content.email}</p>
                    <p><strong>Role:</strong> {selectedReport.content.role}</p>
                    {selectedReport.content.is_banned && (
                      <p style={{ color: '#dc3545' }}>
                        <strong>Status:</strong> Banned - {selectedReport.content.ban_reason}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedReport.content.title && (
                      <p><strong>Title:</strong> {selectedReport.content.title}</p>
                    )}
                    <p><strong>By:</strong> {selectedReport.content.username}</p>
                    <div style={{
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '4px',
                      marginTop: '0.5rem',
                      maxHeight: '150px',
                      overflow: 'auto'
                    }}>
                      {selectedReport.content.content || selectedReport.content.description || 'No content'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedReport.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateReport(selectedReport.id, 'resolved', 'Action taken')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✓ Resolve
                  </button>
                  <button
                    onClick={() => handleUpdateReport(selectedReport.id, 'dismissed', 'No action needed')}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✕ Dismiss
                  </button>
                </>
              )}
              
              {selectedReport.content_type !== 'user' && selectedReport.content && (
                <button
                  onClick={() => handleDeleteContent(selectedReport.content_type, selectedReport.content_id)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Delete Content
                </button>
              )}
              
              {selectedReport.content && selectedReport.content.user_id && (
                <button
                  onClick={() => handleBanUser(selectedReport.content.user_id, `Violation: ${selectedReport.reason}`)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#343a40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🚫 Ban User
                </button>
              )}

              {selectedReport.content_type === 'user' && selectedReport.content && !selectedReport.content.is_banned && (
                <button
                  onClick={() => handleBanUser(selectedReport.content_id, `Reported: ${selectedReport.reason}`)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#343a40',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  🚫 Ban This User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Moderation;

