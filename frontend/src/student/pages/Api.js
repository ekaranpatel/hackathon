// Example for Vite (if you use import.meta.env)
export const BACKEND_URL = 
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000/api' // Change 5000 if your local backend runs on a different port (e.g., 8000)
    : 'https://labdynamix.onrender.com/api';

// OR if you use Create React App (process.env.NODE_ENV):
// export const BACKEND_URL = 
//   process.env.NODE_ENV === 'development'
//     ? 'http://localhost:5000/api'
//     : 'https://labdynamix.onrender.com/api';