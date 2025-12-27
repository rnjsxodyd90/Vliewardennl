const { Pool } = require('pg');

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
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
        is_banned BOOLEAN DEFAULT false,
        ban_reason TEXT,
        banned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add role and ban columns if they don't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin'));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_banned') THEN
          ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ban_reason') THEN
          ALTER TABLE users ADD COLUMN ban_reason TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='banned_at') THEN
          ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
        END IF;
      END $$;
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

    // Districts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        city_id INTEGER NOT NULL REFERENCES cities(id),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(city_id, name)
      )
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        icon TEXT,
        description TEXT,
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
        contact_email TEXT,
        contact_phone TEXT,
        contact_whatsapp TEXT,
        show_contact_info BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        category_id INTEGER REFERENCES categories(id),
        district_id INTEGER REFERENCES districts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns to existing posts table if they don't exist
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='contact_email') THEN
          ALTER TABLE posts ADD COLUMN contact_email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='contact_phone') THEN
          ALTER TABLE posts ADD COLUMN contact_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='contact_whatsapp') THEN
          ALTER TABLE posts ADD COLUMN contact_whatsapp TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='show_contact_info') THEN
          ALTER TABLE posts ADD COLUMN show_contact_info BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='view_count') THEN
          ALTER TABLE posts ADD COLUMN view_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='category_id') THEN
          ALTER TABLE posts ADD COLUMN category_id INTEGER REFERENCES categories(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='district_id') THEN
          ALTER TABLE posts ADD COLUMN district_id INTEGER REFERENCES districts(id);
        END IF;
      END $$;
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

    // Reports table - users can report inappropriate content
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER NOT NULL REFERENCES users(id),
        content_type TEXT NOT NULL CHECK(content_type IN ('post', 'comment', 'article', 'article_comment', 'user')),
        content_id INTEGER NOT NULL,
        reason TEXT NOT NULL CHECK(reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'non_english', 'other')),
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        resolution_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update reports reason constraint to include non_english (for existing tables)
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reason_check;
        ALTER TABLE reports ADD CONSTRAINT reports_reason_check
          CHECK(reason IN ('spam', 'harassment', 'inappropriate', 'scam', 'non_english', 'other'));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    // Conversations table - for direct messaging between users
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER NOT NULL REFERENCES users(id),
        user2_id INTEGER NOT NULL REFERENCES users(id),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id),
        CONSTRAINT different_users CHECK (user1_id < user2_id)
      )
    `);

    // Messages table - individual messages within conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default cities (major Dutch cities)
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

    // Insert districts for major cities
    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Centrum'), ('Noord'), ('Oost'), ('Zuid'), ('West'), ('Nieuw-West'), ('Zuidoost')
      ) AS d(name)
      WHERE c.name = 'Amsterdam'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Centrum'), ('Noord'), ('Zuid'), ('Oost'), ('West'), ('Delfshaven'), ('Feijenoord'), ('Kralingen-Crooswijk')
      ) AS d(name)
      WHERE c.name = 'Rotterdam'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Centrum'), ('Scheveningen'), ('Laak'), ('Escamp'), ('Segbroek'), ('Loosduinen')
      ) AS d(name)
      WHERE c.name = 'The Hague'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Binnenstad'), ('Oost'), ('West'), ('Zuid'), ('Noordwest'), ('Zuidwest'), ('Overvecht'), ('Leidsche Rijn')
      ) AS d(name)
      WHERE c.name = 'Utrecht'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Centrum'), ('Woensel'), ('Strijp'), ('Gestel'), ('Tongelre')
      ) AS d(name)
      WHERE c.name = 'Eindhoven'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO districts (city_id, name)
      SELECT c.id, d.name FROM cities c
      CROSS JOIN (VALUES
        ('Centrum'), ('Zuid'), ('Oost'), ('West'), ('Noord')
      ) AS d(name)
      WHERE c.name = 'Groningen'
      ON CONFLICT (city_id, name) DO NOTHING
    `);

    // Insert default categories
    await client.query(`
      INSERT INTO categories (name, icon, description) VALUES
        ('Housing', '', 'Apartments, rooms, roommates'),
        ('Jobs', '', 'Job listings and opportunities'),
        ('Services', '', 'Professional services and freelancers'),
        ('Items for Sale', '', 'Buy and sell items'),
        ('Electronics', '', 'Phones, computers, gadgets'),
        ('Furniture', '', 'Home and office furniture'),
        ('Vehicles', '', 'Cars, bikes, scooters'),
        ('Events', '', 'Meetups and gatherings'),
        ('Other', '', 'Everything else')
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
