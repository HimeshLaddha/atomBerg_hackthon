// src/config/api.js
// Single source of truth for the backend base URL.
// Strips any trailing slash so that both:
//   VITE_API_URL=https://goalsync-api.onrender.com
//   VITE_API_URL=https://goalsync-api.onrender.com/   ← (trailing slash)
// produce correct paths like: https://goalsync-api.onrender.com/api/goals

const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = raw.replace(/\/+$/, ''); // strip trailing slash(es)
export default API;

