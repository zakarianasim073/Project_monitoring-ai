import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  res.json({ 
    token, 
    user: { id: user._id, name: user.name, email: user.email } 
  });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: 'User already exists' });

  const user = new User({ name, email, password });
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
  res.json({ token, user: { id: user._id, name, email } });
});

export default router;
