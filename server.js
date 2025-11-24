import express from 'express';
import http from 'http';
import cors from 'cors';
import connectDB  from './src/config/db.js';
import authRoutes from './src/routes/auth.routes.js';
import usersRoutes from './src/routes/users.routes.js';
import convRoutes from './src/routes/conv.routes.js';
import uploadRoutes from './src/routes/upload.routes.js';
import setupSocket from './src/sockets/socket.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', convRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

const server = http.createServer(app);

import { Server } from 'socket.io';
const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN || '*' } });

setupSocket(io);

const start = async () => {
  await connectDB();
  server.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
};

start();
