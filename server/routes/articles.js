const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const db = require('../database/db');
const { verifyToken } = require('./auth');

// Get all articles with filters
router.get('/', [
  query('city_id').optional().isInt()
], (req, res) => {
  try {
    const { city_id } = req.query;
    const database = db.getDb();
    
    let query = `
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
      query += ' AND a.city_id = ?';
      params.push(city_id);
    }

    query += ' GROUP BY a.id ORDER BY a.created_at DESC';

    database.all(query, params, (err, articles) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(articles);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single article
router.get('/:id', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        a.*,
        u.username,
        c.name as city_name,
        c.province
      FROM articles a
      JOIN users u ON a.user_id = u.id
      JOIN cities c ON a.city_id = c.id
      WHERE a.id = ?
    `;

    database.get(query, [req.params.id], (err, article) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json(article);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create article
router.post('/', verifyToken, [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('city_id').isInt().withMessage('City ID is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, city_id, image_url } = req.body;
    const database = db.getDb();

    database.run(
      'INSERT INTO articles (user_id, city_id, title, content, image_url) VALUES (?, ?, ?, ?, ?)',
      [req.userId, city_id, title, content, image_url || null],
      function(err) {
        if (err) {
          console.error('Error creating article:', err);
          return res.status(500).json({ error: 'Failed to create article' });
        }

        // Fetch the created article
        database.get(`
          SELECT 
            a.*,
            u.username,
            c.name as city_name
          FROM articles a
          JOIN users u ON a.user_id = u.id
          JOIN cities c ON a.city_id = c.id
          WHERE a.id = ?
        `, [this.lastID], (err, article) => {
          if (err) {
            return res.status(500).json({ error: 'Failed to fetch created article' });
          }
          res.status(201).json(article);
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update article
router.put('/:id', verifyToken, [
  body('title').optional().trim().isLength({ min: 3 }),
  body('content').optional().trim().isLength({ min: 10 })
], (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    const database = db.getDb();

    // Check if article exists and belongs to user
    database.get('SELECT user_id FROM articles WHERE id = ?', [req.params.id], (err, article) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      if (article.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updates = [];
      const params = [];

      if (title) {
        updates.push('title = ?');
        params.push(title);
      }
      if (content) {
        updates.push('content = ?');
        params.push(content);
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
        `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update article' });
          }

          database.get(`
            SELECT 
              a.*,
              u.username,
              c.name as city_name
            FROM articles a
            JOIN users u ON a.user_id = u.id
            JOIN cities c ON a.city_id = c.id
            WHERE a.id = ?
          `, [req.params.id], (err, article) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch updated article' });
            }
            res.json(article);
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete article
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const database = db.getDb();

    database.get('SELECT user_id FROM articles WHERE id = ?', [req.params.id], (err, article) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }
      if (article.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      database.run('DELETE FROM articles WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete article' });
        }
        res.json({ message: 'Article deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for an article
router.get('/:id/comments', (req, res) => {
  try {
    const database = db.getDb();
    const query = `
      SELECT 
        ac.*,
        u.username
      FROM article_comments ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.article_id = ?
      ORDER BY ac.created_at ASC
    `;

    database.all(query, [req.params.id], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(comments);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create comment on article
router.post('/:id/comments', verifyToken, [
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const articleId = req.params.id;
    const database = db.getDb();

    // Verify article exists
    database.get('SELECT id FROM articles WHERE id = ?', [articleId], (err, article) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!article) {
        return res.status(404).json({ error: 'Article not found' });
      }

      database.run(
        'INSERT INTO article_comments (article_id, user_id, content) VALUES (?, ?, ?)',
        [articleId, req.userId, content],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create comment' });
          }

          database.get(`
            SELECT 
              ac.*,
              u.username
            FROM article_comments ac
            JOIN users u ON ac.user_id = u.id
            WHERE ac.id = ?
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

// Delete comment on article
router.delete('/comments/:commentId', verifyToken, (req, res) => {
  try {
    const database = db.getDb();

    database.get('SELECT user_id FROM article_comments WHERE id = ?', [req.params.commentId], (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      if (comment.user_id !== req.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      database.run('DELETE FROM article_comments WHERE id = ?', [req.params.commentId], (err) => {
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

