// server.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Ride = require('../models/ride');
const Vehicle = require('../models/vehicle');
const auth = require('../middleware/auth');

const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const PORT = 3000;

const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/ride');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');
const vehicleRoutes = require('./routes/vehicle');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicle', vehicleRoutes);

app.get('/', (req, res) => res.send('🚖 MyTaxi API is running'));

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server on http://localhost:${process.env.PORT}`);
});


// models/user.js

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', userSchema);


// models/ride.js

const rideSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  driverId: mongoose.Schema.Types.ObjectId,
  pickupLocation: String,
  dropoffLocation: String,
  fare: Number,
  status: { type: String, enum: ['pending', 'ongoing', 'completed'], default: 'pending' }
});

module.exports = mongoose.model('Ride', rideSchema);


// models/vehicle.js

const vehicleSchema = new mongoose.Schema({
  driverId: mongoose.Schema.Types.ObjectId,
  plateNumber: String,
  model: String,
  color: String
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
{
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = auth;

// routes/auth.js

router.post('/register', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, password: hashed, phone, role });
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.isBlocked) return res.status(401).json({ error: 'Access denied' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Wrong password' });

  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ message: 'Login success', token });
});

module.exports = router;


// routes/ride.js

router.post('/request', auth, async (req, res) => {
  const { pickupLocation, dropoffLocation, fare } = req.body;
  try {
    const ride = await Ride.create({
      userId: req.user.userId,
      pickupLocation,
      dropoffLocation,
      fare
    });
    res.json({ message: 'Ride requested', ride });
  } catch (err) {
    res.status(500).json({ error: 'Request failed' });
  }
});

module.exports = router;


// routes/driver.js

router.put('/availability', auth, async (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Unauthorized' });
  const { isAvailable } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.userId, { isAvailable });
    res.json({ message: 'Availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;


// routes/admin.js

router.put('/block/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: 'Action failed' });
  }
});

router.delete('/delete/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;


// routes/vehicle.js

router.post('/add', auth, async (req, res) => {
  if (req.user.role !== 'driver') return res.status(403).json({ error: 'Unauthorized' });
  const { plateNumber, model, color } = req.body;
  try {
    const vehicle = await Vehicle.create({ driverId: req.user.userId, plateNumber, model, color });
    res.json({ message: 'Vehicle added', vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

module.exports = router;
