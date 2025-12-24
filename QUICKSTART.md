# Quick Start Guide

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Configure environment:**
   ```bash
   cd server
   copy .env.example .env
   ```
   (On Linux/Mac: `cp .env.example .env`)
   
   Edit `server/.env` and set a secure `JWT_SECRET`:
   ```
   PORT=5000
   JWT_SECRET=your-very-secure-random-string-here
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

   This starts both:
   - Backend API server on `http://localhost:5000`
   - Frontend React app on `http://localhost:3000`

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## First Steps

1. **Register an account** - Click "Register" in the header
2. **Create a post** - Click "Create Post" after logging in
3. **Browse posts** - Use filters to find posts by city, category, or type
4. **Leave comments** - Engage with posts by leaving comments

## Default Cities

The platform comes pre-loaded with 15 major Dutch cities:
- Amsterdam, Rotterdam, The Hague, Utrecht, Eindhoven
- Groningen, Tilburg, Almere, Breda, Nijmegen
- Enschede, Haarlem, Arnhem, Zaanstad, Amersfoort

## Default Categories

**Goods:**
- Electronics, Furniture, Clothing, Vehicles, Books
- Sports & Outdoors, Home & Garden, Toys & Games

**Services:**
- Tutoring, Cleaning, Repair, Delivery
- Event Planning, Photography

## Troubleshooting

**Port already in use:**
- Change `PORT` in `server/.env` for backend
- Change port in `client/package.json` scripts for frontend

**Database errors:**
- Delete `server/database/vliewardennl.db` and restart server
- The database will be recreated automatically

**CORS errors:**
- Make sure backend is running on port 5000
- Check `REACT_APP_API_URL` in client if using custom backend URL

