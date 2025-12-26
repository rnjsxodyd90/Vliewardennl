const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Valid content types
const VALID_CONTENT_TYPES = ['post', 'comment', 'article', 'article_comment'];

// Get vote counts for a piece of content
router.get('/:contentType/:contentId', async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const result = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)::int as upvotes,
        COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)::int as downvotes
      FROM votes
      WHERE content_type = $1 AND content_id = $2
    `, [contentType, contentId]);

    const row = result.rows[0];
    res.json({
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      score: row.upvotes - row.downvotes
    });
  } catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's vote on a piece of content
router.get('/:contentType/:contentId/user', verifyToken, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const result = await db.query(`
      SELECT vote_type
      FROM votes
      WHERE user_id = $1 AND content_type = $2 AND content_id = $3
    `, [req.userId, contentType, contentId]);

    res.json({
      userVote: result.rows.length > 0 ? result.rows[0].vote_type : 0
    });
  } catch (error) {
    console.error('Get user vote error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to return updated vote counts
async function returnVoteCounts(contentType, contentId, userVote, res) {
  const result = await db.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END), 0)::int as upvotes,
      COALESCE(SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END), 0)::int as downvotes
    FROM votes
    WHERE content_type = $1 AND content_id = $2
  `, [contentType, contentId]);

  const row = result.rows[0];
  res.json({
    upvotes: row.upvotes,
    downvotes: row.downvotes,
    score: row.upvotes - row.downvotes,
    userVote: userVote
  });
}

// Cast a vote (upvote or downvote)
router.post('/', verifyToken, [
  body('content_type').isIn(VALID_CONTENT_TYPES).withMessage('Invalid content type'),
  body('content_id').isInt().withMessage('Content ID is required'),
  body('vote_type').isIn([-1, 1]).withMessage('Vote type must be 1 (upvote) or -1 (downvote)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content_type, content_id, vote_type } = req.body;

    // Check if user already voted
    const existingVote = await db.query(`
      SELECT id, vote_type FROM votes
      WHERE user_id = $1 AND content_type = $2 AND content_id = $3
    `, [req.userId, content_type, content_id]);

    if (existingVote.rows.length > 0) {
      const vote = existingVote.rows[0];
      if (vote.vote_type === vote_type) {
        // Same vote - remove it (toggle off)
        await db.query('DELETE FROM votes WHERE id = $1', [vote.id]);
        return await returnVoteCounts(content_type, content_id, 0, res);
      } else {
        // Different vote - update it
        await db.query('UPDATE votes SET vote_type = $1 WHERE id = $2', [vote_type, vote.id]);
        return await returnVoteCounts(content_type, content_id, vote_type, res);
      }
    } else {
      // New vote - insert it
      await db.query(`
        INSERT INTO votes (user_id, content_type, content_id, vote_type)
        VALUES ($1, $2, $3, $4)
      `, [req.userId, content_type, content_id, vote_type]);
      return await returnVoteCounts(content_type, content_id, vote_type, res);
    }
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a vote
router.delete('/:contentType/:contentId', verifyToken, async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    
    if (!VALID_CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    await db.query(`
      DELETE FROM votes
      WHERE user_id = $1 AND content_type = $2 AND content_id = $3
    `, [req.userId, contentType, contentId]);

    return await returnVoteCounts(contentType, contentId, 0, res);
  } catch (error) {
    console.error('Delete vote error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


