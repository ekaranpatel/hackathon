// Example for Vite (if you use import.meta.env)
export const BACKEND_URL = 
  import.meta.env.MODE === 'development'
    ? 'http://localhost:4000/api' // Change 5000 if your local backend runs on a different port (e.g., 8000)
    : 'https://hackathon-qyq7.onrender.com';

 