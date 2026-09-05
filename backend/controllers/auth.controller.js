const User = require('../models/User');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Centralized JWT Token Generator
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'your_fallback_secret_key';
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || user.category || null,
    },
    secret,
    { expiresIn: '7d' }
  );
};

// Standardized User Payload Formatter
const formatUserResponse = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || user.category || '',
  category: user.category || '',
  status: user.status || 'Active',
  avatar: user.avatar || '',
});

// 1. GOOGLE OAUTH LOGIN / REGISTER
const googleAuth = async (req, res) => {
  const { code, redirect_uri } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  // 🟢 Resolve redirect_uri safely
  let targetRedirectUri = redirect_uri;

  if (!targetRedirectUri) {
    // If running locally without explicit client redirect_uri, fallback to local dev server
    targetRedirectUri = process.env.NODE_ENV === 'production'
      ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'https://lab-dynamix.vercel.app')
      : 'http://localhost:5173';
  } else if (targetRedirectUri !== 'postmessage') {
    // Strip accidental trailing slashes for standard URL matches
    targetRedirectUri = targetRedirectUri.replace(/\/$/, '');
  }

  try {
    // Swap code for access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: targetRedirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token } = tokenResponse.data;

    // Fetch Google profile
    const userProfileResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userProfileResponse.data;
    const normalizedEmail = profile.email.toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Pass raw random string so pre('save') hook hashes it once
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
      user = new User({
        email: normalizedEmail,
        name: profile.name,
        avatar: profile.picture,
        role: 'Student',
        status: 'Active',
        password: randomPassword,
      });
      await user.save();
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }

    const appToken = generateToken(user);

    return res.json({
      message: 'Google login successful',
      token: appToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('OAuth Exchange Failure:', error.response?.data || error.message);
    const googleErrorMsg =
      error.response?.data?.error_description || error.response?.data?.error || 'Authentication handshake failed';
    return res.status(500).json({ message: googleErrorMsg });
  }
};

// 2. GET CURRENT LOGGED-IN USER
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(formatUserResponse(user));
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 3. CREATE USER (REGISTER)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, category, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'Student',
      category: category || department || '',
      department: department || category || '',
      status: 'Active',
    });

    const token = generateToken(user);

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: formatUserResponse(user),
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

// 4. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = {
  googleAuth,
  getMe,
  createUser,
  loginUser,
};