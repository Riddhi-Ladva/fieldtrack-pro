require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/geofences', require('./routes/geoFenceRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/', (req, res) => {
  res.send('FieldTrack Pro API is running');
});

// Socket.io Realtime Logic
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join Organization Room
  socket.on('join-org', (organizationId) => {
    socket.join(organizationId);
    console.log(`Socket ${socket.id} joined org ${organizationId}`);
  });

  // Handle Location Update
  socket.on('send-location', (data) => {
    // data should contain { organizationId, userId, location: { lat, lng } }
    if (data.organizationId) {
      // Broadcast to everyone in the organization room (Admin/Editor dashboards)
      io.to(data.organizationId).emit('live-location-update', {
        userId: data.userId,
        location: data.location,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
