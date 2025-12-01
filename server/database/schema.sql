-- PhishHunt Database Schema
-- Created for Final Year Project by Venus Ong Jin Wen

CREATE DATABASE IF NOT EXISTS phishhunt_db;
USE phishhunt_db;

-- Users table with enhanced user management
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Info
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NULL,  -- NULL for guests initially
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    
    -- Authentication
    password_hash VARCHAR(255) NULL,  -- NULL for guest & OAuth users
    is_guest BOOLEAN DEFAULT FALSE,
    
    -- NEW: Auth Provider Info
    auth_provider ENUM('guest', 'local', 'google') NOT NULL DEFAULT 'local',
    auth_provider_id VARCHAR(191) NULL,  -- Google user ID (sub)
    email_verified BOOLEAN DEFAULT FALSE,
    
    -- Status
    status ENUM('active', 'disabled') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    -- Statistics (for registered users only)
    total_playthroughs INT DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0.00,
    total_correct_answers INT DEFAULT 0,
    total_questions_answered INT DEFAULT 0,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_auth_provider (auth_provider),
    UNIQUE KEY ux_provider_id (auth_provider, auth_provider_id)
);

-- Optional: Database-level constraint (MySQL 8.0.16+)
-- Ensures local users MUST have password, guests CANNOT have password
ALTER TABLE users
  ADD CONSTRAINT chk_pwd_vs_provider
  CHECK (
    (auth_provider = 'local' AND password_hash IS NOT NULL)
    OR
    (auth_provider IN ('guest', 'google') AND password_hash IS NULL)
  );

-- Email phishing scenarios (50 scenarios)
CREATE TABLE email_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Basic Info
    title VARCHAR(200) NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_email VARCHAR(150) NOT NULL,
    subject VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,                    -- Can contain {{firstName}}, {{email}}
    
    -- NEW: Template variables configuration
    requires_user_input BOOLEAN DEFAULT FALSE, -- Does this scenario need user info?
    template_variables JSON,                   -- Which variables are needed
    
    -- Rest of fields...
    is_phishing BOOLEAN NOT NULL,
    logo_url VARCHAR(500),
    links JSON,
    attachments JSON,
    indicators JSON NOT NULL,
    overall_explanation TEXT,
    learning_points TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SMS phishing scenarios (30 scenarios)
CREATE TABLE IF NOT EXISTS sms_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    sender_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    red_flags TEXT, -- JSON string of red flags to look for
    explanation TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wi-Fi phishing scenarios (15 scenarios)
CREATE TABLE IF NOT EXISTS wifi_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    network_name VARCHAR(100) NOT NULL,
    security_type VARCHAR(50) NOT NULL,
    signal_strength INT NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    red_flags TEXT, -- JSON string of red flags to look for
    explanation TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Playthroughs - Keep ALL games (completed AND incomplete)
CREATE TABLE IF NOT EXISTS playthroughs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_type ENUM('classic', 'email', 'sms', 'wifi', 'mixed') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,                -- NULL if quit, has value if completed
    total_scenarios INT NOT NULL,
    total_correct INT DEFAULT 0,
    total_incorrect INT DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0.00,
    total_time_seconds INT DEFAULT 0,
    average_response_time DECIMAL(8,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,         -- FALSE = quit, TRUE = completed
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_playthroughs (user_id, started_at),
    INDEX idx_session_type (session_type),
    INDEX idx_completed (is_completed)          -- Important for filtering!
);

-- Scenario Responses - Keep ALL answers (even from quit games)
CREATE TABLE IF NOT EXISTS scenario_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playthrough_id INT NOT NULL,
    scenario_type ENUM('email', 'sms', 'wifi') NOT NULL,
    scenario_id INT NOT NULL,
    user_answer BOOLEAN NOT NULL,
    correct_answer BOOLEAN NOT NULL,
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (playthrough_id) REFERENCES playthroughs(id) ON DELETE CASCADE,
    INDEX idx_playthrough_responses (playthrough_id),
    INDEX idx_scenario_type (scenario_type)
);

-- User Progress - Aggregate stats
CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scenario_type ENUM('email', 'sms', 'wifi') NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    incorrect_answers INT DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0.00,
    average_response_time DECIMAL(8,2) DEFAULT 0.00,
    last_played TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_scenario (user_id, scenario_type),
    INDEX idx_user_progress (user_id, scenario_type)
);

-- Educational tips and articles
CREATE TABLE IF NOT EXISTS educational_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('email', 'sms', 'wifi', 'general') NOT NULL,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


