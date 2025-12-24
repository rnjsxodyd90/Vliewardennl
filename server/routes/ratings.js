const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get ratings for a user
router.get('/user/:userId', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        r.*,
        u.username as rater_username,
        p.title as post_title
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      JOIN posts p ON r.post_id = p.id
      WHERE r.rated_user_id = ?
      ORDER BY r.created_at DESC
    `;

    database.all(query, [req.params.userId], (err, ratings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(ratings);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get average rating for a user
router.get('/user/:userId/average', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM ratings
      WHERE rated_user_id = ?
    `;

    database.get(query, [req.params.userId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        average_rating: Math.round(result.average_rating * 10) / 10,
        total_ratings: result.total_ratings
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user can rate (post must be sold and user must not be the owner)
router.get('/can-rate/:postId', verifyToken, (req, res) => {
  try {
    const database = db.getDb();
    
    // First check if post exists and is sold
    database.get('SELECT * FROM posts WHERE id = ?', [req.params.postId], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Can't rate your own post
      if (post.user_id === req.userId) {
        return res.json({ canRate: false, reason: 'Cannot rate your own post' });
      }
      
      // Post must be sold to rate
      if (post.status !== 'sold') {
        return res.json({ canRate: false, reason: 'Post must be marked as sold first' });
      }
      
      // Check if already rated
      database.get(
        'SELECT id FROM ratings WHERE rater_id = ? AND post_id = ?',
        [req.userId, req.params.postId],
        (err, existingRating) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (existingRating) {
            return res.json({ canRate: false, reason: 'Already rated this transaction' });
          }
          
          res.json({ 
            canRate: true, 
            postOwnerId: post.user_id 
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create rating
router.post('/', verifyToken, [
  body('post_id').isInt().withMessage('Post ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { post_id, rating, comment } = req.body;
    const database = db.getDb();

    // Get post to find the owner
    database.get('SELECT * FROM posts WHERE id = ?', [post_id], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      // Can't rate your own post
      if (post.user_id === req.userId) {
        return res.status(400).json({ error: 'Cannot rate your own post' });
      }
      
      // Post must be sold
      if (post.status !== 'sold') {
        return res.status(400).json({ error: 'Can only rate sold transactions' });
      }

      // Check if already rated
      database.get(
        'SELECT id FROM ratings WHERE rater_id = ? AND post_id = ?',
        [req.userId, post_id],
        (err, existingRating) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (existingRating) {
            return res.status(400).json({ error: 'Already rated this transaction' });
          }

          // Create the rating
          database.run(
            'INSERT INTO ratings (rater_id, rated_user_id, post_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
            [req.userId, post.user_id, post_id, rating, comment || null],
            function(err) {
              if (err) {
                console.error('Error creating rating:', err);
                return res.status(500).json({ error: 'Failed to create rating' });
              }

              // Fetch the created rating
              database.get(`
                SELECT 
                  r.*,
                  u.username as rater_username
                FROM ratings r
                JOIN users u ON r.rater_id = u.id
                WHERE r.id = ?
              `, [this.lastID], (err, newRating) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to fetch created rating' });
                }
                res.status(201).json(newRating);
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

