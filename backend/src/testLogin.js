require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testLogin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'admin@demo.com' });
  console.log('User found:', user ? 'Yes' : 'No');
  if (user) {
    const isMatch = await user.matchPassword('password123');
    console.log('Password match:', isMatch);
  }
  process.exit();
};

testLogin();
