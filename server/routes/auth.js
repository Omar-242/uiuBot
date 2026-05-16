import express from 'express';
import { hashPassword, comparePassword } from '../utils/customHash.js';
import { encryptEmail, decryptEmail } from '../utils/emailEncrypt.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTP, verifyOTP } from '../utils/otp.js';

const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const encEmail = encryptEmail(email);
    const existing = await User.findOne({ email: encEmail });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const hash = hashPassword(password);
    const user = await User.create({ name, email: encEmail, passwordHash: hash });
    await sendOTP(email);
    res.status(201).json({ message: 'Registered. OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const encEmail = encryptEmail(email);
    const user = await User.findOne({ email: encEmail });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const match = comparePassword(password, user.passwordHash);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    await sendOTP(email);
    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// OTP Verification
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const valid = await verifyOTP(email, otp); // pass plain email
    if (!valid) return res.status(400).json({ message: 'Invalid OTP' });
    const encEmail = encryptEmail(email);
    const user = await User.findOne({ email: encEmail });
    const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1d' });
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
