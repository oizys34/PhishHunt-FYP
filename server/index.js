const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'My5QLph15h@hunt',
  database: process.env.DB_NAME || 'phishhunt_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Import routes
const userRoutes = require('./routes/users');
const playthroughRoutes = require('./routes/playthroughs');

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('═══════════════════════════════════════');
    console.log('✅ MySQL Database connected successfully!');
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🌐 Host: ${dbConfig.host}`);
    console.log(`🔌 Port: ${dbConfig.port}`);
    console.log('═══════════════════════════════════════');
    connection.release();
    return true;
  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ MySQL connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error('\n📝 Troubleshooting:');
    console.error('   1. Check if MySQL is running');
    console.error('   2. Verify credentials in .env.development');
    console.error('   3. Ensure database exists: phishhunt_db');
    console.error(`   4. Check port: ${dbConfig.port}`);
    console.error('═══════════════════════════════════════');
    return false;
  }
}

// Routes
app.use('/api/users', userRoutes);
app.use('/api/playthroughs', playthroughRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PhishHunt API is running',
    timestamp: new Date().toISOString()
  });
});

// Helper function to build exclude clause for SQL
function buildExcludeClause(excludeIds, tablePrefix = '') {
  if (!excludeIds || excludeIds.length === 0) {
    return '';
  }
  const idPlaceholders = excludeIds.map(() => '?').join(',');
  return `AND ${tablePrefix}id NOT IN (${idPlaceholders})`;
}

// Scenarios routes
app.get('/api/scenarios/email', async (req, res) => {
  try {
    // Individual training mode: return ALL email scenarios (no limit)
    const excludeIds = req.query.exclude ? JSON.parse(req.query.exclude) : [];
    
    let query = 'SELECT * FROM email_scenarios WHERE 1=1';
    const params = [];
    
    if (excludeIds.length > 0) {
      query += ' AND id NOT IN (' + excludeIds.map(() => '?').join(',') + ')';
      params.push(...excludeIds);
    }
    
    // No LIMIT - return all available scenarios
    query += ' ORDER BY RAND()';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching email scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch email scenarios' });
  }
});

app.get('/api/scenarios/sms', async (req, res) => {
  try {
    // Individual training mode: return ALL SMS scenarios (no limit)
    const excludeIds = req.query.exclude ? JSON.parse(req.query.exclude) : [];
    
    let query = 'SELECT * FROM sms_scenarios WHERE 1=1';
    const params = [];
    
    if (excludeIds.length > 0) {
      query += ' AND id NOT IN (' + excludeIds.map(() => '?').join(',') + ')';
      params.push(...excludeIds);
    }
    
    // No LIMIT - return all available scenarios
    query += ' ORDER BY RAND()';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching SMS scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch SMS scenarios' });
  }
});

app.get('/api/scenarios/wifi', async (req, res) => {
  try {
    // Individual training mode: return ALL WiFi scenarios (no limit)
    const excludeIds = req.query.exclude ? JSON.parse(req.query.exclude) : [];
    
    let query = 'SELECT * FROM wifi_scenarios WHERE 1=1';
    const params = [];
    
    if (excludeIds.length > 0) {
      query += ' AND id NOT IN (' + excludeIds.map(() => '?').join(',') + ')';
      params.push(...excludeIds);
    }
    
    // No LIMIT - return all available scenarios
    query += ' ORDER BY RAND()';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Wi-Fi scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch Wi-Fi scenarios' });
  }
});

// Normal mode endpoint: 12 email, 6 SMS, 2 WiFi
app.get('/api/scenarios/normal', async (req, res) => {
  try {
    const excludeEmail = req.query.excludeEmail ? JSON.parse(req.query.excludeEmail) : [];
    const excludeSMS = req.query.excludeSMS ? JSON.parse(req.query.excludeSMS) : [];
    const excludeWiFi = req.query.excludeWiFi ? JSON.parse(req.query.excludeWiFi) : [];
    
    // Fetch 12 email scenarios
    let emailQuery = 'SELECT *, "email" as type FROM email_scenarios WHERE 1=1';
    const emailParams = [];
    if (excludeEmail.length > 0) {
      emailQuery += ' AND id NOT IN (' + excludeEmail.map(() => '?').join(',') + ')';
      emailParams.push(...excludeEmail);
    }
    emailQuery += ' ORDER BY RAND() LIMIT 12';
    const [emailRows] = await pool.execute(emailQuery, emailParams);
    
    // Fetch 6 SMS scenarios
    let smsQuery = 'SELECT *, "sms" as type FROM sms_scenarios WHERE 1=1';
    const smsParams = [];
    if (excludeSMS.length > 0) {
      smsQuery += ' AND id NOT IN (' + excludeSMS.map(() => '?').join(',') + ')';
      smsParams.push(...excludeSMS);
    }
    smsQuery += ' ORDER BY RAND() LIMIT 6';
    const [smsRows] = await pool.execute(smsQuery, smsParams);
    
    // Fetch 2 WiFi scenarios
    let wifiQuery = 'SELECT *, "wifi" as type FROM wifi_scenarios WHERE 1=1';
    const wifiParams = [];
    if (excludeWiFi.length > 0) {
      wifiQuery += ' AND id NOT IN (' + excludeWiFi.map(() => '?').join(',') + ')';
      wifiParams.push(...excludeWiFi);
    }
    wifiQuery += ' ORDER BY RAND() LIMIT 2';
    const [wifiRows] = await pool.execute(wifiQuery, wifiParams);
    
    // Combine and shuffle
    const allScenarios = [...emailRows, ...smsRows, ...wifiRows];
    
    // Shuffle array
    for (let i = allScenarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allScenarios[i], allScenarios[j]] = [allScenarios[j], allScenarios[i]];
    }
    
    res.json(allScenarios);
  } catch (error) {
    console.error('Error fetching normal mode scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch normal mode scenarios' });
  }
});

// Mixed mode endpoint: all available scenarios from all three types (no exclusions, no limit)
app.get('/api/scenarios/mixed', async (req, res) => {
  try {
    // Mixed mode always returns ALL scenarios, no exclusions
    const [emailRows] = await pool.execute('SELECT *, "email" as type FROM email_scenarios ORDER BY RAND()');
    const [smsRows] = await pool.execute('SELECT *, "sms" as type FROM sms_scenarios ORDER BY RAND()');
    const [wifiRows] = await pool.execute('SELECT *, "wifi" as type FROM wifi_scenarios ORDER BY RAND()');
    
    // Combine ALL scenarios
    const allScenarios = [...emailRows, ...smsRows, ...wifiRows];
    
    // Shuffle array
    for (let i = allScenarios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allScenarios[i], allScenarios[j]] = [allScenarios[j], allScenarios[i]];
    }
    
    // Return all scenarios (no limit, no exclusions)
    res.json(allScenarios);
  } catch (error) {
    console.error('Error fetching mixed mode scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch mixed mode scenarios' });
  }
});

// Score submission
app.post('/api/scores', async (req, res) => {
  try {
    const { userId, scenarioType, scenarioId, isCorrect, responseTime } = req.body;
    
    await pool.execute(
      'INSERT INTO user_scores (user_id, scenario_type, scenario_id, is_correct, response_time, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, scenarioType, scenarioId, isCorrect, responseTime]
    );
    
    res.json({ success: true, message: 'Score recorded successfully' });
  } catch (error) {
    console.error('Error recording score:', error);
    res.status(500).json({ error: 'Failed to record score' });
  }
});

// Get user statistics
app.get('/api/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [stats] = await pool.execute(`
      SELECT 
        scenario_type,
        COUNT(*) as total_attempts,
        SUM(is_correct) as correct_answers,
        AVG(response_time) as avg_response_time
      FROM user_scores 
      WHERE user_id = ? 
      GROUP BY scenario_type
    `, [userId]);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PhishHunt server running on port ${PORT}`);
  testConnection();
});

module.exports = app;
