require('dotenv').config();
const express = require('express');
const cors = require('cors');
 const http = require('http');
const connectDB = require('./config/db');
 const { initSocket } = require('./socket');
const app = express();

connectDB();

 
const allowedOrigins = [
  'http://localhost:5173',
 ,
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,  
].filter(Boolean);

 

 
app.use(cors(allowedOrigins));

app.use(express.json());
 
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io);

 
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
const PORT = process.env.PORT || 5000;

 
server.listen(PORT, () => console.log(`🚀 Server & Socket.io listening on port ${PORT}`));