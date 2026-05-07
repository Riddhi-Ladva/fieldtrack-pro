/**
 * safeSeeder.js — Appends demo attendance data WITHOUT touching existing users/orgs.
 * Safe to run multiple times: it checks for existing demo data before inserting.
 * Run with: node src/safeSeeder.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Organization = require('./models/Organization');
const AttendanceSession = require('./models/AttendanceSession');
const connectDB = require('./config/db');

const DEMO_TAG = 'DEMO_SEEDED'; // Used in deviceId to mark fake records

const safeSeeder = async () => {
  try {
    await connectDB();

    // 1. Find the first existing Org & its members — DO NOT DELETE anything
    const org = await Organization.findOne({});
    if (!org) {
      console.log('❌ No organisation found. Run main seeder first.');
      process.exit(1);
    }

    const members = await User.find({ organizationId: org._id, role: 'Member' });
    if (members.length === 0) {
      console.log('❌ No Member users found in the org. Add members first.');
      process.exit(1);
    }

    // 2. Check if demo data already exists
    const existingDemo = await AttendanceSession.countDocuments({
      organizationId: org._id,
      deviceId: { $regex: DEMO_TAG }
    });

    if (existingDemo > 0) {
      console.log(`✅ ${existingDemo} demo records already exist. Skipping seed.`);
      console.log('   To re-seed, delete documents where deviceId contains "DEMO_SEEDED".');
      process.exit(0);
    }

    // 3. Generate 45 days of realistic attendance
    const sessions = [];
    const now = new Date();
    const modes = ['Remote', 'Remote', 'Remote', 'Geo-Fenced']; // 75% remote

    for (let d = 1; d <= 45; d++) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);

      // Skip ~20% of days (simulate days off)
      if (Math.random() < 0.2) continue;

      for (const member of members) {
        // Each member skips ~15% of days randomly
        if (Math.random() < 0.15) continue;

        const punchIn = new Date(day);
        punchIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

        const punchOut = new Date(punchIn);
        punchOut.setHours(punchIn.getHours() + 6 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);

        const duration = Math.round((punchOut - punchIn) / 60000);
        const distance = parseFloat((Math.random() * 20).toFixed(2));
        const mode = modes[Math.floor(Math.random() * modes.length)];

        sessions.push({
          userId: member._id,
          organizationId: org._id,
          punchInTime: punchIn,
          punchOutTime: punchOut,
          status: 'Completed',
          mode,
          punchInLocation: { lat: 37.7749 + (Math.random() - 0.5) * 0.05, lng: -122.4194 + (Math.random() - 0.5) * 0.05 },
          deviceId: `${DEMO_TAG}_${member._id}_${d}`, // Clearly marked as demo
          totalDistance: distance,
          duration
        });
      }
    }

    await AttendanceSession.insertMany(sessions);

    console.log('');
    console.log('✅ Safe seed complete!');
    console.log(`   Organisation : ${org.name}`);
    console.log(`   Members seeded: ${members.length}`);
    console.log(`   Sessions inserted: ${sessions.length}`);
    console.log(`   Date range: last 45 days`);
    console.log('');
    console.log('🔑 Existing login credentials are UNCHANGED.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

safeSeeder();
