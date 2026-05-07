require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const GeoFence = require('./models/GeoFence');
const AttendanceSession = require('./models/AttendanceSession');
const connectDB = require('./config/db');

const bulkSeed = async () => {
  try {
    await connectDB();

    // 1. Clean existing data
    await AttendanceSession.deleteMany();
    await User.deleteMany();
    await Organization.deleteMany();
    await GeoFence.deleteMany();

    console.log('--- Database Cleaned ---');

    // 2. Create Organization
    const orgId = new mongoose.Types.ObjectId();
    const adminId = new mongoose.Types.ObjectId();

    const organization = await Organization.create({
      _id: orgId,
      name: 'FieldTrack Global Operations',
      createdBy: adminId,
      trackingInterval: 5
    });

    // 3. Create Users (Admin + 3 Members)
    const admin = await User.create({
      _id: adminId,
      name: 'Super Admin',
      email: 'admin@fieldtrack.com',
      password: 'password123',
      role: 'Admin',
      organizationId: orgId
    });

    const members = [];
    const names = ['John Doe', 'Jane Smith', 'Alex Johnson'];
    for (let i = 0; i < 3; i++) {
      const user = await User.create({
        name: names[i],
        email: `member${i+1}@fieldtrack.com`,
        password: 'password123',
        role: 'Member',
        organizationId: orgId
      });
      members.push(user);
    }

    console.log('--- Users Created ---');

    // 4. Create GeoFences
    const fence = await GeoFence.create({
      name: 'Main HQ Office',
      organizationId: orgId,
      location: { lat: 37.7749, lng: -122.4194 },
      radius: 500
    });

    // 5. Bulk Seed Attendance (Past 45 Days)
    const sessions = [];
    const now = new Date();
    
    for (let d = 0; d < 45; d++) {
      const currentDate = new Date();
      currentDate.setDate(now.getDate() - d);
      
      // Each member works almost every day
      for (const user of members) {
        // Skip some days randomly (weekends etc)
        if (Math.random() > 0.8) continue;

        // Morning Shift (9 AM - 5 PM approx)
        const punchIn = new Date(currentDate);
        punchIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const punchOut = new Date(punchIn);
        punchOut.setHours(punchIn.getHours() + 7 + Math.floor(Math.random() * 3));

        const duration = Math.round((punchOut - punchIn) / 60000);
        const distance = Number((Math.random() * 15).toFixed(2)); // Random travel distance

        sessions.push({
          userId: user._id,
          organizationId: orgId,
          punchInTime: punchIn,
          punchOutTime: punchOut,
          status: 'Completed',
          mode: Math.random() > 0.3 ? 'Remote' : 'Geo-Fenced',
          punchInLocation: { lat: 37.7749, lng: -122.4194 },
          deviceId: `device_mock_${user._id}`,
          totalDistance: distance,
          duration: duration
        });
      }
    }

    await AttendanceSession.insertMany(sessions);

    console.log(`--- ${sessions.length} Attendance Records Seeded ---`);
    console.log('-------------------------');
    console.log('Test Credentials:');
    console.log('Admin: admin@fieldtrack.com / password123');
    console.log('Member: member1@fieldtrack.com / password123');
    console.log('-------------------------');
    
    process.exit();
  } catch (error) {
    console.error(`Seed Error: ${error.message}`);
    process.exit(1);
  }
};

bulkSeed();
