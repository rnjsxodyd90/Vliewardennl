const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get all posts with filters
router.get('/', [
  query('city_id').optional().isInt(),
  query('status').optional().isIn(['active', 'sold', 'closed'])
], async (req, res) => {
  try {
    const { city_id, status } = req.query;
    
    let queryText = `
      SELECT 
        p.*,
        u.username,
        c.name as city_name,
        COUNT(DISTINCT cm.id) as comment_count,
        COALESCE(AVG(r.rating), 0) as user_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN comments cm ON p.id = cm.post_id
      LEFT JOIN ratings r ON p.user_id = r.rated_user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (city_id) {
      queryText += ` AND p.city_id = $${paramIndex}`;
      params.push(city_id);
      paramIndex++;
    }
    if (status) {
      queryText += ` AND p.status = $${paramIndex}`;
      params.push(status);
    } else {
      queryText += ` AND p.status = 'active'`;
    }

    queryText += ' GROUP BY p.id, u.username, c.name ORDER BY p.created_at DESC';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        u.username,
        u.email,
        c.name as city_name,
        c.province,
        COALESCE(AVG(r.rating), 0) as user_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN ratings r ON p.user_id = r.rated_user_id
      WHERE p.id = $1
      GROUP BY p.id, u.username, u.email, c.name, c.province
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim(),
  body('city_id').isInt().withMessage('City ID is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('pay_type').optional().isIn(['hourly', 'total']).withMessage('Pay type must be hourly or total'),
  body('location').optional().trim(),
  body('work_days').optional().trim(),
  body('start_time').optional().trim(),
  body('end_time').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, city_id, price, image_url, pay_type, location, work_days, start_time, end_time } = req.body;

    const result = await db.query(
      `INSERT INTO posts (user_id, city_id, title, description, price, image_url, pay_type, location, work_days, start_time, end_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [req.userId, city_id, title, description || null, price || null, image_url || null, pay_type || null, location || null, work_days || null, start_time || null, end_time || null]
    );

    // Fetch the created post
    const postResult = await db.query(`
      SELECT 
        p.*,
        u.username,
        c.name as city_name,
        COALESCE(AVG(r.rating), 0) as user_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN ratings r ON p.user_id = r.rated_user_id
      WHERE p.id = $1
      GROUP BY p.id, u.username, c.name
    `, [result.rows[0].id]);

    res.status(201).json(postResult.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post
router.put('/:id', verifyToken, [
  body('title').optional().trim().isLength({ min: 3 }),
  body('status').optional().isIn(['active', 'sold', 'closed'])
], async (req, res) => {
  try {
    const { title, description, price, status, image_url, pay_type, location, work_days, start_time, end_time } = req.body;

    // Check if post exists and belongs to user
    const postCheck = await db.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (postCheck.rows[0].user_id !== req.userId) {
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
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex}`);
      params.push(price);
      paramIndex++;
    }
    if (status) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${paramIndex}`);
      params.push(image_url);
      paramIndex++;
    }
    if (pay_type !== undefined) {
      updates.push(`pay_type = $${paramIndex}`);
      params.push(pay_type);
      paramIndex++;
    }
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location);
      paramIndex++;
    }
    if (work_days !== undefined) {
      updates.push(`work_days = $${paramIndex}`);
      params.push(work_days);
      paramIndex++;
    }
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramIndex}`);
      params.push(start_time);
      paramIndex++;
    }
    if (end_time !== undefined) {
      updates.push(`end_time = $${paramIndex}`);
      params.push(end_time);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    await db.query(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    // Fetch updated post
    const postResult = await db.query(`
      SELECT 
        p.*,
        u.username,
        c.name as city_name,
        COALESCE(AVG(r.rating), 0) as user_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN ratings r ON p.user_id = r.rated_user_id
      WHERE p.id = $1
      GROUP BY p.id, u.username, c.name
    `, [req.params.id]);

    res.json(postResult.rows[0]);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const postCheck = await db.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (postCheck.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
