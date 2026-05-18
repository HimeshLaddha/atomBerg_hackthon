// src/config/api.js
// Single source of truth for the backend base URL.
// Vite replaces import.meta.env.VITE_API_URL at build time.
// In development: set VITE_API_URL=http://localhost:5000 in frontend/.env
// In production:  set VITE_API_URL=https://your-app.onrender.com in Vercel dashboard

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default API;
