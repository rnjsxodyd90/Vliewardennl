const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Helper to get or create conversation between two users
const getOrCreateConversation = async (userId1, userId2) => {
  // Ensure user1_id < user2_id for consistent storage
  const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Check if conversation exists
  const existing = await db.query(
    'SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2',
    [user1, user2]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new conversation
  const result = await db.query(
    'INSERT INTO conversations (user1_id, user2_id) VALUES ($1, $2) RETURNING id',
    [user1, user2]
  );

  return result.rows[0].id;
};

// Get all conversations for current user
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        c.id,
        c.last_message_at,
        c.created_at,
        CASE
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        u.username as other_username,
        (
          SELECT content FROM messages
          WHERE conversation_id = c.id
          ORDER BY created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM messages
          WHERE conversation_id = c.id
          AND sender_id != $1
          AND is_read = false
        )::int as unread_count
      FROM conversations c
      JOIN users u ON (
        CASE
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END = u.id
      )
      WHERE (c.user1_id = $1 OR c.user2_id = $1)
      AND u.is_banned = false
      ORDER BY c.last_message_at DESC
    `, [req.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get total unread message count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT COUNT(*)::int as unread_count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.user1_id = $1 OR c.user2_id = $1)
      AND m.sender_id != $1
      AND m.is_read = false
    `, [req.userId]);

    res.json({ unread_count: result.rows[0].unread_count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start or get existing conversation with a user
router.post('/start/:userId', verifyToken, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);

    if (otherUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    // Check if other user exists and is not banned
    const userCheck = await db.query(
      'SELECT id, username FROM users WHERE id = $1 AND is_banned = false',
      [otherUserId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversationId = await getOrCreateConversation(req.userId, otherUserId);

    res.json({
      conversation_id: conversationId,
      other_user: userCheck.rows[0]
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages in a conversation
router.get('/conversations/:id', verifyToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Check if user is part of this conversation
    const convCheck = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversationId, req.userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const conversation = convCheck.rows[0];
    const otherUserId = conversation.user1_id === req.userId
      ? conversation.user2_id
      : conversation.user1_id;

    // Get other user info
    const otherUser = await db.query(
      'SELECT id, username FROM users WHERE id = $1',
      [otherUserId]
    );

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [conversationId]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get messages (newest first for pagination, then reverse for display)
    const messagesResult = await db.query(`
      SELECT
        m.id,
        m.sender_id,
        m.content,
        m.is_read,
        m.created_at,
        u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    // Reverse to show oldest first in UI
    const messages = messagesResult.rows.reverse();

    res.json({
      conversation_id: conversationId,
      other_user: otherUser.rows[0],
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/conversations/:id', verifyToken, [
  body('content').trim().isLength({ min: 1 }).withMessage('Message cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    // Check if user is part of this conversation
    const convCheck = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversationId, req.userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if sender is banned
    const userCheck = await db.query(
      'SELECT is_banned FROM users WHERE id = $1',
      [req.userId]
    );

    if (userCheck.rows[0].is_banned) {
      return res.status(403).json({ error: 'Your account is suspended' });
    }

    // Insert message
    const result = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *',
      [conversationId, req.userId, content]
    );

    // Update conversation's last_message_at
    await db.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
router.put('/conversations/:id/read', verifyToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id);

    // Check if user is part of this conversation
    const convCheck = await db.query(
      'SELECT * FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [conversationId, req.userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark all messages from the other user as read
    await db.query(`
      UPDATE messages
      SET is_read = true
      WHERE conversation_id = $1
      AND sender_id != $2
      AND is_read = false
    `, [conversationId, req.userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
