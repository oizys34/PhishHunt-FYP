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

CREATE TABLE IF NOT EXISTS sms_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- ========== BASIC INFO ==========
    title VARCHAR(200) NOT NULL,
    sender_number VARCHAR(50) NOT NULL,          
    message_content TEXT NOT NULL,               
    
    -- ========== CLASSIFICATION ==========
    is_phishing BOOLEAN NOT NULL,
    
    -- ========== INTERACTIVE ELEMENTS ==========
    links JSON,                                  
    
    -- ========== EDUCATIONAL CONTENT ==========
    indicators JSON NOT NULL,                    
    overall_explanation TEXT,
    learning_points TEXT,
    
    -- ========== METADATA ==========
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wifi_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- ========== BASIC INFO ==========
    title VARCHAR(200) NOT NULL,
    network_name VARCHAR(100) NOT NULL,              -- SSID (e.g., "Starbucks_Free_WiFi")
    
    -- ========== NETWORK DETAILS ==========
    security_type VARCHAR(50) NOT NULL,              -- 'Open', 'WEP', 'WPA', 'WPA2', 'WPA3'
    signal_strength INT NOT NULL,                    -- 0-100 (percentage)
    
    -- ========== CONTEXT ==========
    context_description TEXT NOT NULL,               -- Where/when user encounters this network
    
    -- ========== CLASSIFICATION ==========
    is_phishing BOOLEAN NOT NULL,                    -- TRUE = fake/evil twin, FALSE = legitimate
    
    -- ========== EDUCATIONAL CONTENT ==========
    indicators JSON NOT NULL,                        -- Sequential educational popups
    overall_explanation TEXT,
    learning_points TEXT,
    
    -- ========== METADATA ==========
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ========== INDEXES ==========
    INDEX idx_phishing (is_phishing),
    INDEX idx_created (created_at)
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

-- Password reset codes
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_email_code (email, code),
    INDEX idx_expires (expires_at)
);


