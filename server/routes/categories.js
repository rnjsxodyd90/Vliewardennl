const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all categories
router.get('/', (req, res) => {
  try {
    const database = db.getDb();
    const query = req.query.type 
      ? 'SELECT * FROM categories WHERE type = ? ORDER BY name ASC'
      : 'SELECT * FROM categories ORDER BY type, name ASC';
    
    const params = req.query.type ? [req.query.type] : [];
    
    database.all(query, params, (err, categories) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(categories);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

