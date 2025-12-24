const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get all posts with filters
router.get('/', [
  query('city_id').optional().isInt(),
  query('category_id').optional().isInt(),
  query('type').optional().isIn(['goods', 'services']),
  query('status').optional().isIn(['active', 'sold', 'closed'])
], (req, res) => {
  try {
    const { city_id, category_id, type, status } = req.query;
    const database = db.getDb();
    
    let query = `
      SELECT 
        p.*,
        u.username,
        c.name as city_name,
        cat.name as category_name,
        cat.type as category_type,
        COUNT(DISTINCT cm.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN comments cm ON p.id = cm.post_id
      WHERE 1=1
    `;
    const params = [];

    if (city_id) {
      query += ' AND p.city_id = ?';
      params.push(city_id);
    }
    if (category_id) {
      query += ' AND p.category_id = ?';
      params.push(category_id);
    }
    if (type) {
      query += ' AND cat.type = ?';
      params.push(type);
    }
    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    } else {
      query += ' AND p.status = "active"';
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    database.all(query, params, (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(posts);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single post
router.get('/:id', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        p.*,
        u.username,
        u.email,
        c.name as city_name,
        c.province,
        cat.name as category_name,
        cat.type as category_type
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      JOIN categories cat ON p.category_id = cat.id
      WHERE p.id = ?
    `;

    database.get(query, [req.params.id], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json(post);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create post
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim(),
  body('city_id').isInt().withMessage('City ID is required'),
  body('category_id').isInt().withMessage('Category ID is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, city_id, category_id, price, image_url } = req.body;
    const database = db.getDb();

    database.run(
      'INSERT INTO posts (user_id, city_id, category_id, title, description, price, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, city_id, category_id, title, description || null, price || null, image_url || null],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create post' });
        }

        // Fetch the created post
        database.get(`
          SELECT 
            p.*,
            u.username,
            c.name as city_name,
            cat.name as category_name,
            cat.type as category_type
          FROM posts p
          JOIN users u ON p.user_id = u.id
          JOIN cities c ON p.city_id = c.id
          JOIN categories cat ON p.category_id = cat.id
          WHERE p.id = ?
        `, [this.lastID], (err, post) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch created post' });
          }
          res.status(201).json(post);
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update post
router.put('/:id', verifyToken, [
  body('title').optional().trim().isLength({ min: 3 }),
  body('status').optional().isIn(['active', 'sold', 'closed'])
], (req, res) => {
  try {
    const { title, description, price, status, image_url } = req.body;
    const database = db.getDb();

    // Check if post exists and belongs to user
    database.get('SELECT user_id FROM posts WHERE id = ?', [req.params.id], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      if (post.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updates = [];
      const params = [];

      if (title) {
        updates.push('title = ?');
        params.push(title);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (price !== undefined) {
        updates.push('price = ?');
        params.push(price);
      }
      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      if (image_url !== undefined) {
        updates.push('image_url = ?');
        params.push(image_url);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(req.params.id);

      database.run(
        `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update post' });
          }

          // Fetch updated post
          database.get(`
            SELECT 
              p.*,
              u.username,
              c.name as city_name,
              cat.name as category_name,
              cat.type as category_type
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN cities c ON p.city_id = c.id
            JOIN categories cat ON p.category_id = cat.id
            WHERE p.id = ?
          `, [req.params.id], (err, post) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch updated post' });
            }
            res.json(post);
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete post
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const database = db.getDb();

    database.get('SELECT user_id FROM posts WHERE id = ?', [req.params.id], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      if (post.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      database.run('DELETE FROM posts WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete post' });
        }
        res.json({ message: 'Post deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

