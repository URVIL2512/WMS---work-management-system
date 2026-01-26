import nodemailer from 'nodemailer';

// Validate email configuration
const isEmailConfigured = () => {
  const hasUser = !!process.env.BREVO_SMTP_USER;
  const hasPass = !!process.env.BREVO_SMTP_PASS;
  console.log('📧 [BREVO] Configuration check:', { hasUser, hasPass });
  return hasUser && hasPass;
};

// Create transporter function (called after dotenv loads)
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  [BREVO] Email configuration missing. BREVO_SMTP_USER and BREVO_SMTP_PASS must be set in .env file.');
    return null;
  }

  const config = {
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS
    },
    // Add connection timeout and debug options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    logger: process.env.NODE_ENV === 'development' // Enable logger in development
  };

  console.log('📧 [BREVO] Creating transporter with config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    pass: config.auth.pass ? '***' : 'NOT SET'
  });

  const transporter = nodemailer.createTransport(config);

  // Add error handlers to prevent crashes
  transporter.on('error', (error) => {
    console.error('❌ [BREVO] Transporter error event:', error);
  });

  // Verify transporter configuration (async, don't block)
  // Wrap in try-catch to prevent verification errors from crashing
  try {
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ [BREVO] Transporter verification failed:', error);
        console.error('❌ [BREVO] Error details:', {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode
        });
        // Don't throw - just log the error
      } else {
        console.log('✅ [BREVO] Transporter verified successfully. Server is ready to send emails.');
      }
    });
  } catch (verifyError) {
    console.error('❌ [BREVO] Error during transporter verification:', verifyError);
    // Don't throw - return transporter anyway, errors will be caught during sendMail
  }

  return transporter;
};

// Initialize transporter (will be null if not configured)
let transporter = createTransporter();

// Function to get or recreate transporter (useful if env vars load late)
const getTransporter = () => {
  if (!transporter && isEmailConfigured()) {
    console.log('📧 [BREVO] Recreating transporter...');
    transporter = createTransporter();
  }
  return transporter;
};

export default transporter;
export { isEmailConfigured, getTransporter };
