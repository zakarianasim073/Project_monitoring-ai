import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';

dotenv.config();
const app = express();

app.use(cors({ origin: 'https://project-monitoring-sigma.vercel.app' })); // change to your Vercel URL later
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 BuildTrack Backend LIVE on port ${PORT}`));
