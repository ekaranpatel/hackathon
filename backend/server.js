require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const labRoutes = require('./Routes/Lab.route');
const Resource = require('./models/Resource');
const authRoutes = require('./Routes/auth.route');
const resourceRoutes = require('./Routes/Resource.route');
const { initCronJobs } = require('./config/cronService');
const userRoutes = require('./Routes/Admin.user.route');
const notificationRoutes = require('./Routes/notification.route');
const bookingRoutes = require('./Routes/booking.route');
const LabbookingRoutes = require('./Routes/Labbooking.route')
const facultyRoutes = require('./Routes/Faculty.route');
const adminBookingRoutes = require('./Routes/Admin.booking.route');
const app = express();

connectDB();

// 🟢 Dynamic CORS setup with safe callback & method handling
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null, // Strip trailing slashes
].filter(Boolean);

// Replace your current allowedOrigins and corsOptions with this:

const corsOptions = {
  // Temporarily accept ALL origins by always returning true
  origin: function (origin, callback) {
    callback(null, true); 
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

app.use(express.json());

// 1. Create HTTP Server
const server = http.createServer(app);

// 2. Attach Socket.io & bind to Express app
const io = initSocket(server);
app.set('io', io);

initCronJobs();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/bookings/admin', adminBookingRoutes);
app.use('/api/lab-booking',LabbookingRoutes)
// Root Health Check
app.get('/', (req, res) => {
  res.send('LabDynamix API Engine is running...');
});
 

async function syncAllResourceQuantities() {
  try {
    const resources = await Resource.find({});
    for (const resDoc of resources) {
      await resDoc.save(); // Executes pre('save') hook on every document
    }
    console.log('Successfully resynced all resource available quantities!');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}
const PORT = process.env.PORT || 4000;

// Listen on `server`, NOT `app`
server.listen(PORT, () => console.log(`🚀 Server & Socket.io listening on port ${PORT}`));