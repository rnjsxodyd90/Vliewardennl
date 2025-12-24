const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get comments for a post
router.get('/post/:postId', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        c.*,
        u.username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;

    database.all(query, [req.params.postId], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(comments);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment
router.post('/', verifyToken, [
  body('post_id').isInt().withMessage('Post ID is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { post_id, content } = req.body;
    const database = db.getDb();

    // Verify post exists
    database.get('SELECT id FROM posts WHERE id = ?', [post_id], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      database.run(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [post_id, req.userId, content],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create comment' });
          }

          // Fetch the created comment
          database.get(`
            SELECT 
              c.*,
              u.username
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
          `, [this.lastID], (err, comment) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch created comment' });
            }
            res.status(201).json(comment);
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const database = db.getDb();

    database.get('SELECT user_id FROM comments WHERE id = ?', [req.params.id], (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      database.run('DELETE FROM comments WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete comment' });
        }
        res.json({ message: 'Comment deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

