import User from '../models/User.model.js';
import { generateToken } from '../config/jwt.js';
import { logAudit } from '../utils/auditLogger.js';
import transporter, { isEmailConfigured } from '../utils/brevoMailer.js';
import jwt from 'jsonwebtoken';

// @desc    Register new user (Admin only)
// @route   POST /api/auth/register
// @access  Admin
export const register = async (req, res, next) => {
  try {

    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "Staff"
    })

    if (req.user) {
      await logAudit(req.user._id, "Create", "User", user._id, {
        email: user.email,
        role: user.role
      })
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error("REGISTER ERROR:", error)
    next(error)
  }
}


// @desc    Sign up new user (Public)
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res, next) => {
  try {

    const { name, email, password } = req.body

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Staff"
    })

    const token = generateToken(user._id)

    await logAudit(user._id, "Signup", "Auth", user._id)

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    })

  } catch (error) {
    console.error("SIGNUP ERROR:", error)
    next(error)
  }
}


// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {

    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      })
    }

    // Find user with password field (password is not selected by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password")

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive. Please contact administrator."
      })
    }

    // Check if password exists and is valid
    if (!user.password) {
      console.error(`[LOGIN ERROR] User ${user.email} has no password set`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const token = generateToken(user._id)

    await logAudit(user._id, "Login", "Auth", user._id)

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    })

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    next(error)
  }
}


// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Log audit
    await logAudit(req.user._id, 'Logout', 'Auth', req.user._id);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured in .env file');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.'
      });
    }

    // Generate reset token (expires in 15 minutes)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Check if email is configured
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!isEmailConfigured() || !transporter) {
      // In development mode, log the reset link to console instead of sending email
      if (isDevelopment) {
        console.log('\n' + '='.repeat(70));
        console.log('📧 DEVELOPMENT MODE: Email service not configured');
        console.log('='.repeat(70));
        console.log(`Password Reset Link for ${user.name} (${email}):`);
        console.log(resetLink);
        console.log('='.repeat(70));
        console.log('⚠️  In production, configure Brevo SMTP credentials in .env file');
        console.log('='.repeat(70) + '\n');

        // Log audit
        await logAudit(user._id, 'PASSWORD_RESET_REQUEST', 'Auth', user._id);

        return res.status(200).json({
          success: true,
          message: 'Password reset link generated. Check server console for the link (development mode).'
        });
      } else {
        // In production, require email configuration
        console.error('Email configuration error: BREVO_SMTP_USER and BREVO_SMTP_PASS must be set in .env file');
        return res.status(503).json({
          success: false,
          message: 'Email service is not configured. Please contact administrator.'
        });
      }
    }

    // Send email (production mode or when email is configured)
    try {
      await transporter.sendMail({
        from: process.env.BREVO_SMTP_USER,
        to: email,
        subject: 'Reset Your Password - WMS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested to reset your password for your WMS account.</p>
            <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${resetLink}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
        `
      });

      // Log audit
      await logAudit(user._id, 'PASSWORD_RESET_REQUEST', 'Auth', user._id);

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // In development, fallback to console logging if email fails
      if (isDevelopment) {
        console.log('\n' + '='.repeat(70));
        console.log('📧 Email sending failed. Using development fallback:');
        console.log(`Password Reset Link for ${user.name} (${email}):`);
        console.log(resetLink);
        console.log('='.repeat(70) + '\n');
        
        await logAudit(user._id, 'PASSWORD_RESET_REQUEST', 'Auth', user._id);
        
        return res.status(200).json({
          success: true,
          message: 'Password reset link generated. Check server console for the link (email service unavailable).'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (User model will hash it automatically via pre-save hook)
    user.password = newPassword;
    await user.save();

    // Log audit
    await logAudit(user._id, 'PASSWORD_RESET', 'Auth', user._id);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (Admin only)
// @route   PATCH /api/auth/users/:id/status
// @access  Admin
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent disabling/deactivating yourself
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own account'
      });
    }

    user.isActive = isActive;
    await user.save();

    if (req.user) {
      await logAudit(req.user._id, 'Update', 'User', user._id, {
        action: isActive ? 'Activated' : 'Deactivated',
        email: user.email
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/auth/users/:id
// @access  Admin
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent editing your own account
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot edit your own account. Please use profile settings instead.'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (password) {
      // Password will be hashed automatically by pre-save hook
      user.password = password;
    }

    await user.save();

    // Log audit
    if (req.user) {
      await logAudit(req.user._id, 'Update', 'User', user._id, {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordChanged: !!password
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/auth/users/:id
// @access  Admin
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Log audit before deletion
    if (req.user) {
      await logAudit(req.user._id, 'Delete', 'User', user._id, {
        email: user.email,
        name: user.name,
        role: user.role
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
