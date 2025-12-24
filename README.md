# Vliewardennl - Marketplace Platform for the Netherlands

A modern marketplace platform similar to Daangn (당근마켓) for English users in the Netherlands. Buy, sell, and trade goods and services with city-based categorization.

## Features

- 🏙️ **City-based Organization**: Filter posts by major Dutch cities
- 📦 **Goods & Services**: Separate categories for physical goods and services
- 💬 **Comments System**: Engage with posts through comments
- 👤 **User Authentication**: Secure registration and login
- 🔍 **Advanced Filtering**: Filter by city, category, and type
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- RESTful API

### Frontend
- React with React Router
- Axios for API calls
- Modern CSS with responsive design

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   ```bash
   cd server
   cp .env.example .env
   ```
   Edit `.env` and set your `JWT_SECRET` (use a strong random string in production).

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend React app on `http://localhost:3000`

### Manual Setup (Alternative)

If you prefer to run servers separately:

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm start
```

## Default Data

The database is automatically initialized with:
- **15 Major Dutch Cities**: Amsterdam, Rotterdam, The Hague, Utrecht, Eindhoven, etc.
- **16 Categories**: 
  - Goods: Electronics, Furniture, Clothing, Vehicles, Books, Sports & Outdoors, Home & Garden, Toys & Games
  - Services: Tutoring, Cleaning, Repair, Delivery, Event Planning, Photography

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all posts (with optional filters: city_id, category_id, type, status)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post (requires authentication)
- `PUT /api/posts/:id` - Update post (requires authentication, owner only)
- `DELETE /api/posts/:id` - Delete post (requires authentication, owner only)

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `POST /api/comments` - Create comment (requires authentication)
- `DELETE /api/comments/:id` - Delete comment (requires authentication, owner only)

### Cities
- `GET /api/cities` - Get all cities

### Categories
- `GET /api/categories` - Get all categories (optional filter: type=goods|services)

## Project Structure

```
vliewardennl/
├── server/
│   ├── database/
│   │   └── db.js          # Database initialization and queries
│   ├── routes/
│   │   ├── auth.js        # Authentication routes
│   │   ├── posts.js       # Post CRUD operations
│   │   ├── comments.js    # Comment operations
│   │   ├── cities.js      # City listing
│   │   └── categories.js  # Category listing
│   └── index.js           # Express server setup
├── client/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context (Auth)
│   │   └── App.js         # Main app component
│   └── public/
└── package.json
```

## Features in Detail

### City Filtering
Posts are organized by cities. Users can filter posts to see only items in their city or nearby areas.

### Category System
- **Goods**: Physical items for sale (electronics, furniture, etc.)
- **Services**: Services offered (tutoring, cleaning, repair, etc.)

### Post Management
- Create posts with title, description, price, city, and category
- Optional image URL support
- Mark posts as sold or closed
- Edit and delete your own posts

### Comments
- Leave comments on any post
- View all comments on a post
- Delete your own comments

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** to a strong random string
2. **Use a production database** (PostgreSQL, MySQL) instead of SQLite
3. **Set up environment variables** properly
4. **Enable HTTPS**
5. **Configure CORS** for your domain
6. **Add image upload** functionality (currently only URL support)
7. **Set up proper error logging** and monitoring

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

