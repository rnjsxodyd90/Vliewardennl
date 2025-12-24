const { Pool } = require('pg');

// Debug: Log environment info
console.log('=== Environment Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');
console.log('All env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_')).join(', '));
console.log('=========================');

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('Please add the PostgreSQL DATABASE_URL in Railway Variables.');
  process.exit(1);
}

// Use DATABASE_URL from environment (Railway provides this automatically)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});


const init = async () => {
  try {
    console.log('Connecting to PostgreSQL database...');
    await createTables();
    console.log('Database tables created and initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        province TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Posts table (marketplace listings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        city_id INTEGER NOT NULL REFERENCES cities(id),
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        image_url TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'closed')),
        pay_type TEXT CHECK(pay_type IN ('hourly', 'total')),
        location TEXT,
        work_days TEXT,
        start_time TEXT,
        end_time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comments table (for marketplace posts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ratings table - users can rate each other after transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        rater_id INTEGER NOT NULL REFERENCES users(id),
        rated_user_id INTEGER NOT NULL REFERENCES users(id),
        post_id INTEGER NOT NULL REFERENCES posts(id),
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rater_id, post_id)
      )
    `);

    // Articles table (community posts, not for selling)
    await client.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        city_id INTEGER NOT NULL REFERENCES cities(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Article comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS article_comments (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Votes table - unified voting for posts, comments, articles, article_comments
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        content_type TEXT NOT NULL CHECK(content_type IN ('post', 'comment', 'article', 'article_comment')),
        content_id INTEGER NOT NULL,
        vote_type INTEGER NOT NULL CHECK(vote_type IN (-1, 1)),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, content_type, content_id)
      )
    `);

    // Insert default cities (major Dutch cities) - use ON CONFLICT to avoid duplicates
    await client.query(`
      INSERT INTO cities (name, province) VALUES
        ('Amsterdam', 'North Holland'),
        ('Rotterdam', 'South Holland'),
        ('The Hague', 'South Holland'),
        ('Utrecht', 'Utrecht'),
        ('Eindhoven', 'North Brabant'),
        ('Groningen', 'Groningen'),
        ('Tilburg', 'North Brabant'),
        ('Almere', 'Flevoland'),
        ('Breda', 'North Brabant'),
        ('Nijmegen', 'Gelderland'),
        ('Enschede', 'Overijssel'),
        ('Haarlem', 'North Holland'),
        ('Arnhem', 'Gelderland'),
        ('Zaanstad', 'North Holland'),
        ('Amersfoort', 'Utrecht')
      ON CONFLICT (name) DO NOTHING
    `);
  } finally {
    client.release();
  }
};

// Query helper - returns the pool for direct queries
const query = (text, params) => pool.query(text, params);

const close = async () => {
  await pool.end();
  console.log('Database connection pool closed');
};

module.exports = {
  init,
  query,
  close,
  pool
};
