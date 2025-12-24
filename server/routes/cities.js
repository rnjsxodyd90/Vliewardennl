const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all cities
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cities ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Cities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
