const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const router = express.Router();

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
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const user = users[0];
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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

module.exports = router;


