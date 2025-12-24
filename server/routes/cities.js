const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all cities
router.get('/', (req, res) => {
  try {
    const database = db.getDb();
    database.all('SELECT * FROM cities ORDER BY name ASC', [], (err, cities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(cities);
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

