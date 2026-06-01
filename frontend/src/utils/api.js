// Central API base URL
// In production (Vercel), set REACT_APP_API_URL to your Render backend URL
// e.g. https://your-app.onrender.com
// In development, falls back to empty string so the CRA proxy works normally.
const API_BASE = process.env.REACT_APP_API_URL || '';

export default API_BASE;
