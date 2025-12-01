const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

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

// Start a new playthrough
router.post('/start', async (req, res) => {
  try {
    const { userId, sessionType } = req.body;
    
    // Create new playthrough
    const [result] = await pool.execute(
      'INSERT INTO playthroughs (user_id, session_type, total_scenarios, total_correct, total_incorrect, accuracy, total_time_seconds, is_completed) VALUES (?, ?, 0, 0, 0, 0.00, 0, FALSE)',
      [userId, sessionType]
    );
    
    res.json({
      success: true,
      playthroughId: result.insertId,
      message: 'Playthrough started'
    });
  } catch (error) {
    console.error('Start playthrough error:', error);
    res.status(500).json({ error: 'Failed to start playthrough' });
  }
});

// Record a scenario response
router.post('/response', async (req, res) => {
  try {
    const { 
      playthroughId, 
      scenarioType, 
      scenarioId, 
      userAnswer, 
      correctAnswer, 
      responseTimeMs 
    } = req.body;
    
    const isCorrect = userAnswer === correctAnswer;
    
    // Record the response
    await pool.execute(
      'INSERT INTO scenario_responses (playthrough_id, scenario_type, scenario_id, user_answer, correct_answer, is_correct, response_time_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [playthroughId, scenarioType, scenarioId, userAnswer, correctAnswer, isCorrect, responseTimeMs]
    );
    
    res.json({ success: true, message: 'Response recorded' });
  } catch (error) {
    console.error('Record response error:', error);
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// Complete a playthrough
router.post('/complete', async (req, res) => {
  try {
    const { playthroughId, totalTimeSeconds } = req.body;
    
    // Get all responses for this playthrough
    const [responses] = await pool.execute(
      'SELECT is_correct, response_time_ms, scenario_type FROM scenario_responses WHERE playthrough_id = ?',
      [playthroughId]
    );
    
    // Calculate statistics
    const totalScenarios = responses.length;
    const totalCorrect = responses.filter(r => r.is_correct).length;
    const totalIncorrect = totalScenarios - totalCorrect;
    const accuracy = totalScenarios > 0 ? (totalCorrect / totalScenarios) * 100 : 0;
    const averageResponseTime = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.response_time_ms, 0) / responses.length 
      : 0;
    
    // Update playthrough
    await pool.execute(
      'UPDATE playthroughs SET completed_at = NOW(), total_scenarios = ?, total_correct = ?, total_incorrect = ?, accuracy = ?, total_time_seconds = ?, average_response_time = ?, is_completed = TRUE WHERE id = ?',
      [totalScenarios, totalCorrect, totalIncorrect, accuracy, totalTimeSeconds, averageResponseTime, playthroughId]
    );
    
    // Update user statistics
    const [playthrough] = await pool.execute(
      'SELECT user_id FROM playthroughs WHERE id = ?',
      [playthroughId]
    );
    
    if (playthrough.length > 0) {
      const userId = playthrough[0].user_id;
      
      // Update user totals
      await pool.execute(
        'UPDATE users SET total_playthroughs = total_playthroughs + 1, total_correct_answers = total_correct_answers + ?, total_questions_answered = total_questions_answered + ? WHERE id = ?',
        [totalCorrect, totalScenarios, userId]
      );
      
      // Update best accuracy if this is better
      await pool.execute(
        'UPDATE users SET best_accuracy = GREATEST(best_accuracy, ?) WHERE id = ?',
        [accuracy, userId]
      );
      
      // Update user progress by scenario type
      const scenarioTypes = ['email', 'sms', 'wifi'];
      for (const scenarioType of scenarioTypes) {
        const typeResponses = responses.filter(r => r.scenario_type === scenarioType);
        if (typeResponses.length > 0) {
          const typeCorrect = typeResponses.filter(r => r.is_correct).length;
          const typeIncorrect = typeResponses.length - typeCorrect;
          const typeAccuracy = (typeCorrect / typeResponses.length) * 100;
          const typeAvgTime = typeResponses.reduce((sum, r) => sum + r.response_time_ms, 0) / typeResponses.length;
          
          // Get existing progress to calculate new average correctly
          const [existingProgress] = await pool.execute(
            'SELECT total_attempts, average_response_time FROM user_progress WHERE user_id = ? AND scenario_type = ?',
            [userId, scenarioType]
          );
          
          let newAvgTime = typeAvgTime;
          if (existingProgress.length > 0) {
            const oldAttempts = existingProgress[0].total_attempts;
            const oldAvgTime = existingProgress[0].average_response_time || 0;
            const newAttempts = typeResponses.length;
            // Calculate weighted average: (old_avg * old_count + new_avg * new_count) / (old_count + new_count)
            newAvgTime = (oldAvgTime * oldAttempts + typeAvgTime * newAttempts) / (oldAttempts + newAttempts);
          }
          
          // Insert or update user progress
          await pool.execute(`
            INSERT INTO user_progress (user_id, scenario_type, total_attempts, correct_answers, incorrect_answers, best_accuracy, average_response_time, last_played)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            total_attempts = total_attempts + ?,
            correct_answers = correct_answers + ?,
            incorrect_answers = incorrect_answers + ?,
            best_accuracy = GREATEST(best_accuracy, ?),
            average_response_time = ?,
            last_played = NOW()
          `, [
            userId, scenarioType, typeResponses.length, typeCorrect, typeIncorrect, typeAccuracy, typeAvgTime,
            typeResponses.length, typeCorrect, typeIncorrect, typeAccuracy, newAvgTime
          ]);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Playthrough completed',
      statistics: {
        totalScenarios,
        totalCorrect,
        totalIncorrect,
        accuracy: Math.round(accuracy * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime)
      }
    });
  } catch (error) {
    console.error('Complete playthrough error:', error);
    res.status(500).json({ error: 'Failed to complete playthrough' });
  }
});

// Get user's playthrough history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
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
        average_response_time,
        is_completed
      FROM playthroughs 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);
    
    res.json({ playthroughs });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch playthrough history' });
  }
});

// Get detailed playthrough results
router.get('/results/:playthroughId', async (req, res) => {
  try {
    const { playthroughId } = req.params;
    
    // Get playthrough info
    const [playthroughs] = await pool.execute(
      'SELECT * FROM playthroughs WHERE id = ?',
      [playthroughId]
    );
    
    if (playthroughs.length === 0) {
      return res.status(404).json({ error: 'Playthrough not found' });
    }
    
    // Get detailed responses
    const [responses] = await pool.execute(`
      SELECT 
        sr.*,
        es.title as email_title,
        es.sender as email_sender,
        es.subject as email_subject,
        ss.title as sms_title,
        ss.sender_number as sms_sender,
        ss.message as sms_message,
        ws.title as wifi_title,
        ws.network_name as wifi_network,
        ws.security_type as wifi_security
      FROM scenario_responses sr
      LEFT JOIN email_scenarios es ON sr.scenario_type = 'email' AND sr.scenario_id = es.id
      LEFT JOIN sms_scenarios ss ON sr.scenario_type = 'sms' AND sr.scenario_id = ss.id
      LEFT JOIN wifi_scenarios ws ON sr.scenario_type = 'wifi' AND sr.scenario_id = ws.id
      WHERE sr.playthrough_id = ?
      ORDER BY sr.answered_at
    `, [playthroughId]);
    
    res.json({
      playthrough: playthroughs[0],
      responses
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch playthrough results' });
  }
});

// Quit a playthrough (mark as incomplete)
router.post('/quit', async (req, res) => {
  try {
    const { playthroughId, totalTimeSeconds } = req.body;
    
    // Get all responses for this playthrough
    const [responses] = await pool.execute(
      'SELECT is_correct, response_time_ms, scenario_type FROM scenario_responses WHERE playthrough_id = ?',
      [playthroughId]
    );
    
    // Calculate statistics from responses so far
    const totalScenarios = responses.length;
    const totalCorrect = responses.filter(r => r.is_correct).length;
    const totalIncorrect = totalScenarios - totalCorrect;
    const accuracy = totalScenarios > 0 ? (totalCorrect / totalScenarios) * 100 : 0;
    const averageResponseTime = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.response_time_ms, 0) / responses.length 
      : 0;
    
    // Update playthrough as incomplete (is_completed = FALSE)
    await pool.execute(
      'UPDATE playthroughs SET total_scenarios = ?, total_correct = ?, total_incorrect = ?, accuracy = ?, total_time_seconds = ?, average_response_time = ?, is_completed = FALSE WHERE id = ?',
      [totalScenarios, totalCorrect, totalIncorrect, accuracy, totalTimeSeconds, averageResponseTime, playthroughId]
    );
    
    // Update user progress by scenario type (even for incomplete playthroughs)
    const [playthrough] = await pool.execute(
      'SELECT user_id FROM playthroughs WHERE id = ?',
      [playthroughId]
    );
    
    if (playthrough.length > 0 && responses.length > 0) {
      const userId = playthrough[0].user_id;
      
      // Update user progress by scenario type
      const scenarioTypes = ['email', 'sms', 'wifi'];
      for (const scenarioType of scenarioTypes) {
        const typeResponses = responses.filter(r => r.scenario_type === scenarioType);
        if (typeResponses.length > 0) {
          const typeCorrect = typeResponses.filter(r => r.is_correct).length;
          const typeIncorrect = typeResponses.length - typeCorrect;
          const typeAccuracy = (typeCorrect / typeResponses.length) * 100;
          const typeAvgTime = typeResponses.reduce((sum, r) => sum + r.response_time_ms, 0) / typeResponses.length;
          
          // Get existing progress to calculate new average correctly
          const [existingProgress] = await pool.execute(
            'SELECT total_attempts, average_response_time FROM user_progress WHERE user_id = ? AND scenario_type = ?',
            [userId, scenarioType]
          );
          
          let newAvgTime = typeAvgTime;
          if (existingProgress.length > 0) {
            const oldAttempts = existingProgress[0].total_attempts;
            const oldAvgTime = existingProgress[0].average_response_time || 0;
            const newAttempts = typeResponses.length;
            // Calculate weighted average: (old_avg * old_count + new_avg * new_count) / (old_count + new_count)
            newAvgTime = (oldAvgTime * oldAttempts + typeAvgTime * newAttempts) / (oldAttempts + newAttempts);
          }
          
          // Insert or update user progress
          await pool.execute(`
            INSERT INTO user_progress (user_id, scenario_type, total_attempts, correct_answers, incorrect_answers, best_accuracy, average_response_time, last_played)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            total_attempts = total_attempts + ?,
            correct_answers = correct_answers + ?,
            incorrect_answers = incorrect_answers + ?,
            best_accuracy = GREATEST(best_accuracy, ?),
            average_response_time = ?,
            last_played = NOW()
          `, [
            userId, scenarioType, typeResponses.length, typeCorrect, typeIncorrect, typeAccuracy, typeAvgTime,
            typeResponses.length, typeCorrect, typeIncorrect, typeAccuracy, newAvgTime
          ]);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Playthrough marked as incomplete',
      statistics: {
        totalScenarios,
        totalCorrect,
        totalIncorrect,
        accuracy: Math.round(accuracy * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime)
      }
    });
  } catch (error) {
    console.error('Quit playthrough error:', error);
    res.status(500).json({ error: 'Failed to quit playthrough' });
  }
});

// Get last completed playthrough (classic or mixed mode only)
router.get('/last-completed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the most recent completed playthrough that is classic or mixed
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
        average_response_time,
        is_completed
      FROM playthroughs 
      WHERE user_id = ? 
        AND session_type IN ('classic', 'mixed')
        AND is_completed = TRUE
      ORDER BY completed_at DESC 
      LIMIT 1
    `, [userId]);
    
    if (playthroughs.length === 0) {
      return res.json({ playthrough: null, responses: [] });
    }
    
    const playthrough = playthroughs[0];
    
    // Get all scenario responses for this playthrough
    const [responses] = await pool.execute(
      'SELECT scenario_type, is_correct FROM scenario_responses WHERE playthrough_id = ?',
      [playthrough.id]
    );
    
    res.json({
      playthrough,
      responses
    });
  } catch (error) {
    console.error('Get last completed playthrough error:', error);
    res.status(500).json({ error: 'Failed to fetch last completed playthrough' });
  }
});

// Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get overall user stats
    const [userStats] = await pool.execute(
      'SELECT total_playthroughs, best_accuracy, total_correct_answers, total_questions_answered FROM users WHERE id = ?',
      [userId]
    );
    
    // Get progress by scenario type
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
    
    // Get recent performance (last 5 playthroughs)
    const [recentPerformance] = await pool.execute(`
      SELECT 
        session_type,
        accuracy,
        total_scenarios,
        total_correct,
        started_at
      FROM playthroughs 
      WHERE user_id = ? AND is_completed = TRUE
      ORDER BY started_at DESC 
      LIMIT 5
    `, [userId]);
    
    res.json({
      userStats: userStats[0] || {},
      progress,
      recentPerformance
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;


