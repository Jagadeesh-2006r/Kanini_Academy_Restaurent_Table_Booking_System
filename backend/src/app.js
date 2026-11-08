import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Restaurant Table Reservation API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Fallback 404 handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
