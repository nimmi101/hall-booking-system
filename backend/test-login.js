require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const testLogin = async () => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: 'admin@schedulix.com' });
    if (!user) {
      console.log('Admin user NOT found in DB!');
      process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    console.log('Is it a bcrypt hash?', user.password.startsWith('$2'));
    
    const match = await bcrypt.compare('password123', user.password);
    console.log('Password match result:', match);
    
    process.exit();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

testLogin();
 
