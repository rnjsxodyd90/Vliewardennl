const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get all articles with filters
router.get('/', [
  query('city_id').optional().isInt()
], async (req, res) => {
  try {
    const { city_id } = req.query;
    
    let queryText = `
      SELECT 
        a.*,
        u.username,
        c.name as city_name,
        COUNT(DISTINCT ac.id) as comment_count
      FROM articles a
      JOIN users u ON a.user_id = u.id
      JOIN cities c ON a.city_id = c.id
      LEFT JOIN article_comments ac ON a.id = ac.article_id
      WHERE 1=1
    `;
    const params = [];

    if (city_id) {
      queryText += ' AND a.city_id = $1';
      params.push(city_id);
    }

    queryText += ' GROUP BY a.id, u.username, c.name ORDER BY a.created_at DESC';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single article
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.*,
        u.username,
        c.name as city_name,
        c.province
      FROM articles a
      JOIN users u ON a.user_id = u.id
      JOIN cities c ON a.city_id = c.id
      WHERE a.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create article
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('city_id').isInt().withMessage('City ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, city_id, image_url } = req.body;

    const result = await db.query(
      'INSERT INTO articles (user_id, city_id, title, content, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [req.userId, city_id, title, content, image_url || null]
    );

    // Fetch the created article
    const articleResult = await db.query(`
      SELECT 
        a.*,
        u.username,
        c.name as city_name
      FROM articles a
      JOIN users u ON a.user_id = u.id
      JOIN cities c ON a.city_id = c.id
      WHERE a.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(articleResult.rows[0]);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update article
router.put('/:id', verifyToken, [
  body('title').optional().trim().isLength({ min: 3 }),
  body('content').optional().trim().isLength({ min: 10 })
], async (req, res) => {
  try {
    const { title, content, image_url } = req.body;

    // Check if article exists and belongs to user
    const articleCheck = await db.query('SELECT user_id FROM articles WHERE id = $1', [req.params.id]);
    
    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    if (articleCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }
    if (content) {
      updates.push(`content = $${paramIndex}`);
      params.push(content);
      paramIndex++;
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      params.push(image_url);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.query(
      `UPDATE articles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    const articleResult = await db.query(`
      SELECT 
        a.*,
        u.username,
        c.name as city_name
      FROM articles a
      JOIN users u ON a.user_id = u.id
      JOIN cities c ON a.city_id = c.id
      WHERE a.id = $1
    `, [req.params.id]);

    res.json(articleResult.rows[0]);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete article
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const articleCheck = await db.query('SELECT user_id FROM articles WHERE id = $1', [req.params.id]);
    
    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    if (articleCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for an article
router.get('/:id/comments', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ac.*,
        u.username
      FROM article_comments ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.article_id = $1
      ORDER BY ac.created_at ASC
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get article comments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment on article
router.post('/:id/comments', verifyToken, [
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const articleId = req.params.id;

    // Verify article exists
    const articleCheck = await db.query('SELECT id FROM articles WHERE id = $1', [articleId]);
    if (articleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const result = await db.query(
      'INSERT INTO article_comments (article_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
      [articleId, req.userId, content]
    );

    const commentResult = await db.query(`
      SELECT 
        ac.*,
        u.username
      FROM article_comments ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(commentResult.rows[0]);
  } catch (error) {
    console.error('Create article comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment on article
router.delete('/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const commentCheck = await db.query(
      'SELECT user_id FROM article_comments WHERE id = $1',
      [req.params.commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (commentCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM article_comments WHERE id = $1', [req.params.commentId]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete article comment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

