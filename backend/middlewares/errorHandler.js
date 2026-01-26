const errorHandler = (err, req, res, next) => {
  // Prevent sending response if already sent
  if (res.headersSent) {
    console.error('❌ [ERROR HANDLER] Response already sent, cannot send error response');
    return next(err);
  }

  let error = { ...err };
  error.message = err.message;

  // Log error with full details
  console.error('❌ [ERROR HANDLER] Error occurred:');
  console.error('❌ [ERROR HANDLER] Name:', err.name);
  console.error('❌ [ERROR HANDLER] Message:', err.message);
  console.error('❌ [ERROR HANDLER] Stack:', err.stack);
  if (err.code) console.error('❌ [ERROR HANDLER] Code:', err.code);
  if (err.command) console.error('❌ [ERROR HANDLER] Command:', err.command);
  if (err.response) console.error('❌ [ERROR HANDLER] Response:', err.response);
  if (err.responseCode) console.error('❌ [ERROR HANDLER] ResponseCode:', err.responseCode);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Nodemailer authentication error
  if (err.code === 'EAUTH' || err.responseCode === 535) {
    error = {
      message: 'Email authentication failed. Please check SMTP credentials.',
      statusCode: 401
    };
  }

  // Nodemailer connection errors
  if (err.code === 'ETIMEDOUT' || err.code === 'ECONNECTION') {
    error = {
      message: 'Email server connection failed. Please check network and SMTP settings.',
      statusCode: 503
    };
  }

  try {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        error: err.message,
        name: err.name,
        code: err.code,
        responseCode: err.responseCode
      })
    });
  } catch (responseError) {
    console.error('❌ [ERROR HANDLER] Failed to send error response:', responseError);
    // If we can't send response, at least log it
  }
};

export default errorHandler;
