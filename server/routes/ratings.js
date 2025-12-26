const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        r.*,
        u.username as rater_username,
        p.title as post_title
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      JOIN posts p ON r.post_id = p.id
      WHERE r.rated_user_id = $1
      ORDER BY r.created_at DESC
    `, [req.params.userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get average rating for a user
router.get('/user/:userId/average', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*)::int as total_ratings
      FROM ratings
      WHERE rated_user_id = $1
    `, [req.params.userId]);

    const row = result.rows[0];
    res.json({
      average_rating: Math.round(parseFloat(row.average_rating) * 10) / 10,
      total_ratings: row.total_ratings
    });
  } catch (error) {
    console.error('Get average rating error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user can rate (post must be sold and user must not be the owner)
router.get('/can-rate/:postId', verifyToken, async (req, res) => {
  try {
    // First check if post exists and is sold
    const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [req.params.postId]);
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];
    
    // Can't rate your own post
    if (post.user_id === req.userId) {
      return res.json({ canRate: false, reason: 'Cannot rate your own post' });
    }
    
    // Post must be sold to rate
    if (post.status !== 'sold') {
      return res.json({ canRate: false, reason: 'Post must be marked as sold first' });
    }
    
    // Check if already rated
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND post_id = $2',
      [req.userId, req.params.postId]
    );

    if (existingRating.rows.length > 0) {
      return res.json({ canRate: false, reason: 'Already rated this transaction' });
    }
    
    res.json({ 
      canRate: true, 
      postOwnerId: post.user_id 
    });
  } catch (error) {
    console.error('Can rate error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create rating
router.post('/', verifyToken, [
  body('post_id').isInt().withMessage('Post ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { post_id, rating, comment } = req.body;

    // Get post to find the owner
    const postResult = await db.query('SELECT * FROM posts WHERE id = $1', [post_id]);
    
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];
    
    // Can't rate your own post
    if (post.user_id === req.userId) {
      return res.status(400).json({ error: 'Cannot rate your own post' });
    }
    
    // Post must be sold
    if (post.status !== 'sold') {
      return res.status(400).json({ error: 'Can only rate sold transactions' });
    }

    // Check if already rated
    const existingRating = await db.query(
      'SELECT id FROM ratings WHERE rater_id = $1 AND post_id = $2',
      [req.userId, post_id]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ error: 'Already rated this transaction' });
    }

    // Create the rating
    const result = await db.query(
      'INSERT INTO ratings (rater_id, rated_user_id, post_id, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.userId, post.user_id, post_id, rating, comment || null]
    );

    // Fetch the created rating
    const ratingResult = await db.query(`
      SELECT 
        r.*,
        u.username as rater_username
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(ratingResult.rows[0]);
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


