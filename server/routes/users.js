const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const router = express.Router();

// Load environment variables (in case they're not loaded yet)
// Try to load from server directory, then fall back to default
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // Also try default location

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phishhunt_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Function to get email transporter (created lazily to ensure env vars are loaded)
function getEmailTransporter() {
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  // Debug: Check if password is loaded (but don't log the actual password)
  console.log('Email password loaded:', emailPassword ? 'YES (length: ' + emailPassword.length + ')' : 'NO');
  
  if (!emailPassword || emailPassword.trim() === '') {
    throw new Error('EMAIL_PASSWORD environment variable is not set or is empty. Please set it in your .env file.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'phishhunttraining@gmail.com',
      pass: emailPassword.trim() // Trim whitespace in case of copy/paste issues
    }
  });
}

const generateUsernameFromEmail = async (email) => {
  const base = (email.split('@')[0] || 'user')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 20)
    .toLowerCase() || `user${Date.now()}`;

  let candidate = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [candidate]
    );

    if (rows.length === 0) {
      return candidate;
    }

    candidate = `${base}${suffix}`;
    suffix += 1;
  }
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Check if username exists
    const [usernameRows] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [username]
    );
    
    if (usernameRows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Check if email exists
    const [emailRows] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );
    
    if (emailRows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, is_guest, auth_provider) 
       VALUES (?, ?, ?, ?, ?, FALSE, 'local')`,
      [username, email, hashedPassword, firstName, lastName]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET || 'e25486e79daadaa3ba3ba5a0b5b9e6b286b6b492bc3332cbda9ceae1746e4d16256ef943b89c7fd13d8753161e6dfe29d683d197a3776f98333d3f191c8f25a8',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [username]
    );

    res.json({ available: existingUser.length === 0 });
  } catch (error) {
    console.error('Username check error:', error);
    res.status(500).json({ error: 'Failed to check username availability' });
  }
});

// Google OAuth login / register
router.post('/google', async (req, res) => {
  try {
    const { email, firstName, lastName, googleId, username } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Email and Google ID are required' });
    }

    // Check if user already exists with this Google ID
    const [existingGoogleUsers] = await pool.execute(
      `SELECT id, username, email, first_name, last_name 
       FROM users 
       WHERE auth_provider = 'google' AND auth_provider_id = ?`,
      [googleId]
    );

    if (existingGoogleUsers.length > 0) {
      const user = existingGoogleUsers[0];

      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      return res.json({
        success: true,
        message: 'Google login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isGuest: false
        }
      });
    }

    // Re-use existing local account if email matches
    const [existingEmailUsers] = await pool.execute(
      `SELECT id, username FROM users WHERE LOWER(email) = LOWER(?)`,
      [email]
    );

    if (existingEmailUsers.length > 0) {
      const user = existingEmailUsers[0];

      await pool.execute(
        `UPDATE users 
         SET auth_provider = 'google', auth_provider_id = ?, last_login = NOW() 
         WHERE id = ?`,
        [googleId, user.id]
      );

      return res.json({
        success: true,
        message: 'Google login successful',
        user: {
          id: user.id,
          username: user.username,
          email,
          firstName,
          lastName,
          isGuest: false
        }
      });
    }

    // Need a unique username
    const finalUsername = username && username.trim()
      ? username
      : await generateUsernameFromEmail(email);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, is_guest, auth_provider, auth_provider_id, email_verified) 
       VALUES (?, ?, NULL, ?, ?, FALSE, 'google', ?, TRUE)`,
      [finalUsername, email, firstName || null, lastName || null, googleId]
    );

    res.status(201).json({
      success: true,
      message: 'Google account registered successfully',
      user: {
        id: result.insertId,
        username: finalUsername,
        email,
        firstName,
        lastName,
        isGuest: false
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, first_name, last_name, is_guest FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'e25486e79daadaa3ba3ba5a0b5b9e6b286b6b492bc3332cbda9ceae1746e4d16256ef943b89c7fd13d8753161e6dfe29d683d197a3776f98333d3f191c8f25a8',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isGuest: user.is_guest
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Create guest user
router.post('/guest', async (req, res) => {
  try {
    const { name, email } = req.body;
    const timestamp = Date.now();
    const guestUsername = `guest_${timestamp}`;
    const guestEmail = email || `guest_${timestamp}@phishhunt.com`;

    // Create guest user
    const [result] = await pool.execute(
      `INSERT INTO users (
        username,
        email,
        password_hash,
        first_name,
        last_name,
        is_guest,
        auth_provider,
        auth_provider_id,
        email_verified
      ) VALUES (?, ?, NULL, ?, NULL, TRUE, 'guest', NULL, FALSE)`,
      [guestUsername, guestEmail, name]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, email: guestEmail },
      process.env.JWT_SECRET || 'e25486e79daadaa3ba3ba5a0b5b9e6b286b6b492bc3332cbda9ceae1746e4d16256ef943b89c7fd13d8753161e6dfe29d683d197a3776f98333d3f191c8f25a8',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Guest user created',
      token,
      user: {
        id: result.insertId,
        username: guestUsername,
        email: guestEmail,
        firstName: name,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await pool.execute(
      'SELECT id, username, email, first_name, last_name, is_guest, created_at, last_login, total_playthroughs, best_accuracy, total_correct_answers, total_questions_answered FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Get user progress by scenario type
    const [progress] = await pool.execute(`
      SELECT 
        scenario_type,
        total_attempts,
        correct_answers,
        incorrect_answers,
        best_accuracy,
        average_response_time,
        last_played
      FROM user_progress 
      WHERE user_id = ? 
      ORDER BY scenario_type
    `, [userId]);
    
    // Get recent playthroughs
    const [playthroughs] = await pool.execute(`
      SELECT 
        id,
        session_type,
        started_at,
        completed_at,
        total_scenarios,
        total_correct,
        total_incorrect,
        accuracy,
        total_time_seconds,
        average_response_time
      FROM playthroughs 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT 10
    `, [userId]);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isGuest: user.is_guest,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        totalPlaythroughs: user.total_playthroughs,
        bestAccuracy: user.best_accuracy,
        totalCorrectAnswers: user.total_correct_answers,
        totalQuestionsAnswered: user.total_questions_answered
      },
      progress,
      recentPlaythroughs: playthroughs
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email } = req.body;
    
    await pool.execute(
      'UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = NOW() WHERE id = ?',
      [firstName, lastName, email, userId]
    );
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check if email exists for password reset
router.post('/forgot-password/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email exists and is a local user
    const [users] = await pool.execute(
      'SELECT id, email, auth_provider FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = users[0];
    
    // Check if user is a local user (not Google or guest)
    if (user.auth_provider !== 'local') {
      return res.status(400).json({ error: 'Password reset is not available for this account type' });
    }

    res.json({ 
      success: true, 
      message: 'Email verified',
      email: user.email
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Request password reset code
router.post('/forgot-password/request', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Email, new password, and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email exists and is a local user (has password)
    const [users] = await pool.execute(
      'SELECT id, email, auth_provider FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const user = users[0];
    
    // Check if user is a local user (not Google or guest)
    if (user.auth_provider !== 'local') {
      return res.status(400).json({ error: 'Password reset is not available for this account type' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing unused codes for this email
    await pool.execute(
      'DELETE FROM password_reset_codes WHERE email = ? AND used = FALSE',
      [email]
    );

    // Store the code in database
    await pool.execute(
      'INSERT INTO password_reset_codes (email, code, expires_at) VALUES (?, ?, ?)',
      [email.toLowerCase(), code, expiresAt]
    );

    // Store the new password hash temporarily (we'll update it after verification)
    // Actually, we'll store it in a temporary field or just wait for verification
    // For now, let's store the password hash in the reset code record or use a separate approach
    // We'll verify the code first, then update the password

    // Send email with the code
    const mailOptions = {
      from: 'phishhunttraining@gmail.com',
      to: email,
      subject: 'PhishHunt Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                  <!-- Logo Header -->
                  <tr>
                    <td style="padding: 30px 20px 20px 20px; text-align: center;">
                      <img 
                        src="https://firebasestorage.googleapis.com/v0/b/phishhunt-b2cbd.firebasestorage.app/o/Phishhunt%20Logo%2FPhishHunt.png?alt=media&token=09711e0a-426c-4b4f-aca2-c1d5ccb757f4" 
                        alt="PhishHunt Logo" 
                        style="max-width: 150px; height: auto; display: block; margin: 0 auto;"
                        width="150"
                      />
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 0 30px 20px 30px;">
                      <h2 style="color: #333; text-align: center; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">You have requested to reset your password for your PhishHunt account.</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 20px 0;">Your 6-digit verification code is:</p>
                    </td>
                  </tr>
                  
                  <!-- Verification Code Box -->
                  <tr>
                    <td style="padding: 0 30px 25px 30px;">
                      <div style="background-color: #f4f4f4; padding: 25px; text-align: center; border-radius: 8px; border: 2px solid #e0e0e0;">
                        <h1 style="color: #6366f1; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold; font-family: 'Courier New', monospace;">${code}</h1>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Additional Info -->
                  <tr>
                    <td style="padding: 0 30px 30px 30px;">
                      <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">This code will expire in <strong>15 minutes</strong>.</p>
                      <p style="color: #666; line-height: 1.6; margin: 0;">If you did not request this password reset, please ignore this email.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid #eee;">
                      <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">This is an automated message from PhishHunt Training System.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    try {
      const transporter = getEmailTransporter();
      await transporter.sendMail(mailOptions);
      res.json({ 
        success: true, 
        message: 'Verification code sent to your email',
        email: email // Return email so frontend can use it in next step
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Provide more specific error messages
      if (emailError.message && emailError.message.includes('EMAIL_PASSWORD')) {
        return res.status(500).json({ 
          error: 'Email service not configured. Please contact the administrator.' 
        });
      }
      
      if (emailError.code === 'EAUTH') {
        return res.status(500).json({ 
          error: 'Email authentication failed. Please check EMAIL_PASSWORD configuration.' 
        });
      }
      
      res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify code and reset password
router.post('/forgot-password/verify', async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify the code
    const [codes] = await pool.execute(
      'SELECT * FROM password_reset_codes WHERE LOWER(email) = LOWER(?) AND code = ? AND used = FALSE AND expires_at > NOW()',
      [email, code]
    );

    if (codes.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const resetCode = codes[0];

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, auth_provider FROM users WHERE LOWER(email) = LOWER(?)',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (user.auth_provider !== 'local') {
      return res.status(400).json({ error: 'Password reset is not available for this account type' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Mark the code as used
    await pool.execute(
      'UPDATE password_reset_codes SET used = TRUE WHERE id = ?',
      [resetCode.id]
    );

    res.json({ 
      success: true, 
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Password reset verify error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;


