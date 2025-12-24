const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

