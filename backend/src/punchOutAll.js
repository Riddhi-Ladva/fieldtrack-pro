require('dotenv').config();
const mongoose = require('mongoose');
const AttendanceSession = require('./models/AttendanceSession');

const punchOutAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const result = await AttendanceSession.updateMany(
      { status: 'Active' },
      { 
        status: 'Completed',
        punchOutTime: new Date()
      }
    );

    console.log(`Success: Punched out ${result.modifiedCount} active sessions.`);
    process.exit(0);
  } catch (error) {
    console.error('Error punching out all sessions:', error);
    process.exit(1);
  }
};

punchOutAll();
