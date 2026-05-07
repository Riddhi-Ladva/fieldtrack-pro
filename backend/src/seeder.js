require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Organization = require('./models/Organization');
const GeoFence = require('./models/GeoFence');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Organization.deleteMany();
    await GeoFence.deleteMany();

    // Create Org
    const orgId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    const organization = await Organization.create({
      _id: orgId,
      name: 'FieldTrack Demo Corp',
      createdBy: adminId
    });

    // Create Admin
    const admin = await User.create({
      _id: adminId,
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'password123',
      role: 'Admin',
      organizationId: organization._id,
    });

    // Create Member
    const member = await User.create({
      name: 'Field Worker 1',
      email: 'member@demo.com',
      password: 'password123',
      role: 'Member',
      organizationId: organization._id,
    });

    // Create GeoFence (San Francisco placeholder)
    await GeoFence.create({
      name: 'HQ Building',
      organizationId: organization._id,
      location: { lat: 37.7749, lng: -122.4194 },
      radius: 500
    });

    console.log('Data Seeded Successfully');
    console.log('-------------------------');
    console.log('Login credentials:');
    console.log('Admin: admin@demo.com / password123');
    console.log('Member: member@demo.com / password123');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
