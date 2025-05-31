require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const generateToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Sign Up Route
app.post('/api/signup', async (req, res) => {
  try {
    const { name, age, username, password, weight, height } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      age,
      username,
      password: hashedPassword,
      weight,
      height,
      signupDate: new Date(),
      latestWeightDate: new Date(),
      weights: [{ date: new Date(), weight }]
    });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({ token, message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Cannot find user' });
    }
    if (await bcrypt.compare(password, user.password)) {
      const token = generateToken(user);
      res.json({ token, message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Data (requires authentication)
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -__v');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Add New Weight (requires authentication)
app.post('/api/add-weight', authenticateToken, async (req, res) => {
  try {
    const { weight } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.weights.push({ date: new Date(), weight });
    user.weight = weight; // Update current weight
    user.latestWeightDate = new Date();
    await user.save();
    res.json({ message: 'Weight added successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Place this after all API routes:
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../Public/index.html'));
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});