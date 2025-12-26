const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all districts (optionally filtered by city)
router.get('/', async (req, res) => {
  try {
    const { city_id } = req.query;
    
    let queryText = `
      SELECT d.*, c.name as city_name 
      FROM districts d
      JOIN cities c ON d.city_id = c.id
    `;
    const params = [];

    if (city_id) {
      queryText += ' WHERE d.city_id = $1';
      params.push(city_id);
    }

    queryText += ' ORDER BY c.name, d.name';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


