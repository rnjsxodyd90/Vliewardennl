const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Get user basic info
    const userResult = await db.query(`
      SELECT
        id,
        username,
        role,
        created_at
      FROM users
      WHERE username = $1 AND is_banned = false
    `, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user stats
    const statsResult = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = $1) as total_posts,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = 'active') as active_posts,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND status = 'sold') as sold_posts,
        (SELECT COALESCE(SUM(view_count), 0) FROM posts WHERE user_id = $1) as total_views,
        (SELECT COUNT(*) FROM articles WHERE user_id = $1) as total_articles,
        (SELECT COUNT(*) FROM comments WHERE user_id = $1) as total_comments
    `, [user.id]);

    // Get average rating
    const ratingResult = await db.query(`
      SELECT
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*)::int as total_ratings
      FROM ratings
      WHERE rated_user_id = $1
    `, [user.id]);

    // Get vote stats (upvotes received on posts)
    const voteResult = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) as upvotes_received,
        COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) as downvotes_received
      FROM votes v
      JOIN posts p ON v.content_type = 'post' AND v.content_id = p.id
      WHERE p.user_id = $1
    `, [user.id]);

    const stats = statsResult.rows[0];
    const rating = ratingResult.rows[0];
    const votes = voteResult.rows[0];

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        member_since: user.created_at
      },
      stats: {
        total_posts: parseInt(stats.total_posts),
        active_posts: parseInt(stats.active_posts),
        sold_posts: parseInt(stats.sold_posts),
        total_views: parseInt(stats.total_views),
        total_articles: parseInt(stats.total_articles),
        total_comments: parseInt(stats.total_comments)
      },
      rating: {
        average: Math.round(parseFloat(rating.average_rating) * 10) / 10,
        total_ratings: rating.total_ratings
      },
      votes: {
        upvotes_received: parseInt(votes.upvotes_received),
        downvotes_received: parseInt(votes.downvotes_received)
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts
router.get('/:username/posts', async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const status = req.query.status; // optional filter

    // Get user id
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1 AND is_banned = false',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Build query
    let whereClause = 'WHERE p.user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      whereClause += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    } else {
      // Only show active posts by default for other users
      whereClause += ` AND p.status = 'active'`;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM posts p ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    // Get posts
    params.push(limit, offset);
    const postsResult = await db.query(`
      SELECT
        p.*,
        u.username,
        c.name as city_name,
        d.name as district_name,
        cat.name as category_name,
        cat.icon as category_icon,
        COUNT(DISTINCT cm.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN cities c ON p.city_id = c.id
      LEFT JOIN districts d ON p.district_id = d.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN comments cm ON p.id = cm.post_id
      ${whereClause}
      GROUP BY p.id, u.username, c.name, d.name, cat.name, cat.icon
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    res.json({
      posts: postsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's ratings/reviews
router.get('/:username/ratings', async (req, res) => {
  try {
    const { username } = req.params;

    // Get user id
    const userResult = await db.query(
      'SELECT id FROM users WHERE username = $1 AND is_banned = false',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    const ratingsResult = await db.query(`
      SELECT
        r.*,
        u.username as rater_username,
        p.title as post_title
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      JOIN posts p ON r.post_id = p.id
      WHERE r.rated_user_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json(ratingsResult.rows);
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
