const mongoose = require('mongoose');

//  const dns = require('node:dns');
// dns.setServers(['1.1.1.1', '8.8.8.8']); 

const connectDB = async () => {
  try {
     const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: `);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
