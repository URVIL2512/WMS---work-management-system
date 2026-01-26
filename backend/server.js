import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import errorHandler from './middlewares/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import orderRoutes from './routes/order.routes.js';
import workOrderRoutes from './routes/workOrder.routes.js';
import jobCardRoutes from './routes/jobCard.routes.js';
import jobWorkRoutes from './routes/jobWork.routes.js';
import inwardRoutes from './routes/inward.routes.js';
import internalProcessRoutes from './routes/internalProcess.routes.js';
import inspectionRoutes from './routes/inspection.routes.js';
import completedJobsRoutes from './routes/completedJobs.routes.js';
import dispatchRoutes from './routes/dispatch.routes.js';
import mastersRoutes from './routes/masters.routes.js';
import customerRoutes from './routes/customer.routes.js';
import itemRoutes from './routes/item.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import activityRoutes from './routes/activity.routes.js';

// Load environment variables
dotenv.config();

// Debug ENV values (temporary - remove after confirming)
console.log("BREVO USER:", process.env.BREVO_SMTP_USER);
console.log("BREVO PASS:", process.env.BREVO_SMTP_PASS ? "LOADED" : "NOT LOADED");

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WMS Backend is running' });
});

// Email test route (for debugging - remove in production)
app.get('/api/test-email', async (req, res) => {
  try {
    const { getTransporter, isEmailConfigured } = await import('./utils/brevoMailer.js');
    
    if (!isEmailConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Email not configured',
        env: {
          BREVO_SMTP_USER: process.env.BREVO_SMTP_USER ? 'SET' : 'NOT SET',
          BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS ? 'SET' : 'NOT SET',
          BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
          BREVO_SMTP_PORT: process.env.BREVO_SMTP_PORT || '587'
        }
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create transporter'
      });
    }

    // Test email send
    const testEmail = process.env.BREVO_SMTP_USER;
    const info = await transporter.sendMail({
      from: testEmail,
      to: testEmail, // Send to self for testing
      subject: 'Test Email from WMS',
      text: 'This is a test email from WMS backend.',
      html: '<p>This is a test email from WMS backend.</p>'
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      response: info.response
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/jobcards', jobCardRoutes);
app.use('/api/jobwork', jobWorkRoutes);
app.use('/api/inward', inwardRoutes);
app.use('/api/internal-process', internalProcessRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/completed-jobs', completedJobsRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activities', activityRoutes);

// 404 handler
app.use((req, res) => {
  if (!res.headersSent) {
    res.status(404).json({ success: false, message: 'Route not found' });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Process-level error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('❌ [PROCESS] Uncaught Exception:', error);
  console.error('❌ [PROCESS] Stack:', error.stack);
  // Don't exit - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [PROCESS] Unhandled Rejection at:', promise);
  console.error('❌ [PROCESS] Reason:', reason);
  // Don't exit - log and continue
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle server errors gracefully
server.on('error', (error) => {
  console.error('❌ [SERVER] Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Handle client connection errors
server.on('clientError', (error, socket) => {
  console.error('❌ [SERVER] Client error:', error);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
