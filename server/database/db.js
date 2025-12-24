const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'vliewardennl.db');

let db = null;

const init = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Cities table
      db.run(`CREATE TABLE IF NOT EXISTS cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        province TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Posts table (marketplace listings)
      db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        city_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        image_url TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'closed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (city_id) REFERENCES cities(id)
      )`);

      // Comments table (for marketplace posts)
      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Ratings table - users can rate each other after transactions
      db.run(`CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rater_id INTEGER NOT NULL,
        rated_user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rater_id) REFERENCES users(id),
        FOREIGN KEY (rated_user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(rater_id, post_id)
      )`);

      // Articles table (community posts, not for selling)
      db.run(`CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        city_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (city_id) REFERENCES cities(id)
      )`);

      // Article comments table
      db.run(`CREATE TABLE IF NOT EXISTS article_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      // Insert default cities (major Dutch cities)
      db.run(`INSERT OR IGNORE INTO cities (name, province) VALUES
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
      `, (err) => {
        if (err) {
          console.error('Error inserting default data:', err);
          reject(err);
        } else {
          console.log('Database tables created and initialized');
          resolve();
        }
      });
    });
  });
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call init() first.');
  }
  return db;
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  init,
  getDb,
  close
};
