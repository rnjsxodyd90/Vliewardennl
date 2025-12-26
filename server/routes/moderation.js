const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken, verifyModerator, verifyAdmin } = require('./auth');

// ============ REPORTS ============

// Submit a report (any logged-in user)
router.post('/reports', verifyToken, [
  body('content_type').isIn(['post', 'comment', 'article', 'article_comment', 'user']),
  body('content_id').isInt(),
  body('reason').isIn(['spam', 'harassment', 'inappropriate', 'scam', 'non_english', 'other']),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content_type, content_id, reason, description } = req.body;

    // Check if user already reported this content
    const existingReport = await db.query(
      'SELECT id FROM reports WHERE reporter_id = $1 AND content_type = $2 AND content_id = $3',
      [req.userId, content_type, content_id]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reported this content' });
    }

    // Can't report yourself
    if (content_type === 'user' && content_id === req.userId) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const result = await db.query(
      `INSERT INTO reports (reporter_id, content_type, content_id, reason, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.userId, content_type, content_id, reason, description || null]
    );

    res.status(201).json({ 
      message: 'Report submitted successfully',
      reportId: result.rows[0].id 
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reports (moderators only)
router.get('/reports', verifyModerator, async (req, res) => {
  try {
    const { status, content_type } = req.query;
    
    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` WHERE r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (content_type) {
      whereClause += whereClause ? ' AND' : ' WHERE';
      whereClause += ` r.content_type = $${paramIndex}`;
      params.push(content_type);
      paramIndex++;
    }

    const result = await db.query(`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reviewer.username as reviewer_username
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY 
        CASE r.status 
          WHEN 'pending' THEN 1 
          WHEN 'reviewed' THEN 2 
          ELSE 3 
        END,
        r.created_at DESC
    `, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get report details with content info (moderators only)
router.get('/reports/:id', verifyModerator, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reviewer.username as reviewer_username
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    // Fetch the reported content based on type
    let content = null;
    if (report.content_type === 'post') {
      const contentResult = await db.query(`
        SELECT p.*, u.username FROM posts p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = $1
      `, [report.content_id]);
      content = contentResult.rows[0];
    } else if (report.content_type === 'comment') {
      const contentResult = await db.query(`
        SELECT c.*, u.username FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.id = $1
      `, [report.content_id]);
      content = contentResult.rows[0];
    } else if (report.content_type === 'article') {
      const contentResult = await db.query(`
        SELECT a.*, u.username FROM articles a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.id = $1
      `, [report.content_id]);
      content = contentResult.rows[0];
    } else if (report.content_type === 'article_comment') {
      const contentResult = await db.query(`
        SELECT ac.*, u.username FROM article_comments ac 
        JOIN users u ON ac.user_id = u.id 
        WHERE ac.id = $1
      `, [report.content_id]);
      content = contentResult.rows[0];
    } else if (report.content_type === 'user') {
      const contentResult = await db.query(
        'SELECT id, username, email, role, is_banned, ban_reason, created_at FROM users WHERE id = $1',
        [report.content_id]
      );
      content = contentResult.rows[0];
    }

    res.json({ ...report, content });
  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update report status (moderators only)
router.put('/reports/:id', verifyModerator, [
  body('status').isIn(['reviewed', 'resolved', 'dismissed']),
  body('resolution_note').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, resolution_note } = req.body;

    await db.query(`
      UPDATE reports 
      SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, resolution_note = $3
      WHERE id = $4
    `, [status, req.userId, resolution_note || null, req.params.id]);

    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ CONTENT MODERATION ============

// Delete post (moderators only)
router.delete('/posts/:id', verifyModerator, async (req, res) => {
  try {
    const postCheck = await db.query('SELECT id, title, user_id FROM posts WHERE id = $1', [req.params.id]);
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Post deleted by moderator' });
  } catch (error) {
    console.error('Moderator delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (moderators only)
router.delete('/comments/:id', verifyModerator, async (req, res) => {
  try {
    const commentCheck = await db.query('SELECT id FROM comments WHERE id = $1', [req.params.id]);
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Comment deleted by moderator' });
  } catch (error) {
    console.error('Moderator delete comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete article (moderators only)
router.delete('/articles/:id', verifyModerator, async (req, res) => {
  try {
    const articleCheck = await db.query('SELECT id FROM articles WHERE id = $1', [req.params.id]);
    
    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await db.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Article deleted by moderator' });
  } catch (error) {
    console.error('Moderator delete article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete article comment (moderators only)
router.delete('/article-comments/:id', verifyModerator, async (req, res) => {
  try {
    const commentCheck = await db.query('SELECT id FROM article_comments WHERE id = $1', [req.params.id]);
    
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    await db.query('DELETE FROM article_comments WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Article comment deleted by moderator' });
  } catch (error) {
    console.error('Moderator delete article comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ USER MANAGEMENT ============

// Get all users (admin only)
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, username, email, role, is_banned, ban_reason, banned_at, created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = users.id) as post_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban user (moderators can ban, only admin can ban moderators)
router.post('/users/:id/ban', verifyModerator, [
  body('reason').trim().notEmpty().withMessage('Ban reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;
    const targetUserId = parseInt(req.params.id);

    // Can't ban yourself
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'You cannot ban yourself' });
    }

    // Check target user
    const userCheck = await db.query('SELECT role FROM users WHERE id = $1', [targetUserId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetRole = userCheck.rows[0].role;

    // Only admin can ban moderators
    if ((targetRole === 'moderator' || targetRole === 'admin') && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Only admins can ban moderators or other admins' });
    }

    // Can't ban admins (even as admin)
    if (targetRole === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin accounts' });
    }

    await db.query(`
      UPDATE users 
      SET is_banned = true, ban_reason = $1, banned_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [reason, targetUserId]);

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unban user (moderators only)
router.post('/users/:id/unban', verifyModerator, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id);

    const result = await db.query(`
      UPDATE users 
      SET is_banned = false, ban_reason = NULL, banned_at = NULL
      WHERE id = $1
      RETURNING id
    `, [targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change user role (admin only)
router.put('/users/:id/role', verifyAdmin, [
  body('role').isIn(['user', 'moderator', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;
    const targetUserId = parseInt(req.params.id);

    // Can't change your own role
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const result = await db.query(`
      UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role
    `, [role, targetUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============ STATS ============

// Get moderation stats (moderators only)
router.get('/stats', verifyModerator, async (req, res) => {
  try {
    const [pendingReports, totalReports, bannedUsers, totalUsers] = await Promise.all([
      db.query("SELECT COUNT(*) FROM reports WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) FROM reports"),
      db.query("SELECT COUNT(*) FROM users WHERE is_banned = true"),
      db.query("SELECT COUNT(*) FROM users")
    ]);

    res.json({
      pendingReports: parseInt(pendingReports.rows[0].count),
      totalReports: parseInt(totalReports.rows[0].count),
      bannedUsers: parseInt(bannedUsers.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

