-- PhishHunt SQLite Database Schema
-- Created for Final Year Project by Venus Ong Jin Wen

-- Users table with enhanced user management
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- NULL for guest users
    is_guest BOOLEAN DEFAULT 0,
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    total_playthroughs INTEGER DEFAULT 0,
    best_accuracy REAL DEFAULT 0.00,
    total_correct_answers INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0
);

-- Email phishing scenarios (50 scenarios)
CREATE TABLE IF NOT EXISTS email_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sender TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    difficulty_level TEXT DEFAULT 'medium',
    red_flags TEXT, -- JSON string of red flags to look for
    explanation TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SMS phishing scenarios (30 scenarios)
CREATE TABLE IF NOT EXISTS sms_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sender_number TEXT NOT NULL,
    message TEXT NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    difficulty_level TEXT DEFAULT 'medium',
    red_flags TEXT, -- JSON string of red flags to look for
    explanation TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wi-Fi phishing scenarios (15 scenarios)
CREATE TABLE IF NOT EXISTS wifi_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    network_name TEXT NOT NULL,
    security_type TEXT NOT NULL,
    signal_strength INTEGER NOT NULL,
    is_phishing BOOLEAN NOT NULL,
    difficulty_level TEXT DEFAULT 'medium',
    red_flags TEXT, -- JSON string of red flags to look for
    explanation TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Playthrough sessions - tracks each complete game session
CREATE TABLE IF NOT EXISTS playthroughs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type TEXT NOT NULL, -- 'email', 'sms', 'wifi', 'mixed'
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    total_scenarios INTEGER NOT NULL,
    total_correct INTEGER NOT NULL,
    total_incorrect INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    total_time_seconds INTEGER NOT NULL, -- total time in seconds
    average_response_time REAL, -- average response time in milliseconds
    is_completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Individual scenario responses within a playthrough
CREATE TABLE IF NOT EXISTS scenario_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playthrough_id INTEGER NOT NULL,
    scenario_type TEXT NOT NULL, -- 'email', 'sms', 'wifi'
    scenario_id INTEGER NOT NULL,
    user_answer BOOLEAN NOT NULL, -- true = user said phishing, false = user said legitimate
    correct_answer BOOLEAN NOT NULL, -- true = actually phishing, false = actually legitimate
    is_correct BOOLEAN NOT NULL, -- user_answer == correct_answer
    response_time_ms INTEGER NOT NULL, -- time taken to answer in milliseconds
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playthrough_id) REFERENCES playthroughs(id) ON DELETE CASCADE
);

-- User progress tracking by scenario type
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scenario_type TEXT NOT NULL, -- 'email', 'sms', 'wifi'
    total_attempts INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    best_accuracy REAL DEFAULT 0.00,
    average_response_time REAL DEFAULT 0.00,
    last_played DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, scenario_type)
);

-- Educational tips and articles
CREATE TABLE IF NOT EXISTS educational_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL, -- 'email', 'sms', 'wifi', 'general'
    difficulty_level TEXT DEFAULT 'beginner',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO email_scenarios (title, sender, subject, content, is_phishing, difficulty_level, red_flags, explanation) VALUES
('Urgent Bank Security Alert', 'security@bankofamerica.com', 'URGENT: Verify Your Account Immediately', 'Dear Customer,\n\nWe have detected suspicious activity on your account. Please verify your identity by clicking the link below:\n\nhttps://bank-verification-now.com/verify\n\nFailure to verify within 24 hours will result in account suspension.\n\nBank of America Security Team', 1, 'easy', '["Urgent language", "Suspicious link", "Threat of account suspension"]', 'This is a phishing email. Real banks never ask for verification via email links. The URL is suspicious and the urgent language is designed to create panic.'),
('Legitimate Newsletter', 'newsletter@microsoft.com', 'Microsoft 365 Updates - December 2024', 'Hello,\n\nHere are the latest updates for Microsoft 365:\n\n- New security features\n- Performance improvements\n- Bug fixes\n\nFor more information, visit our official website.\n\nMicrosoft Team', 0, 'easy', '[]', 'This is a legitimate newsletter from Microsoft with no suspicious elements.');

INSERT INTO sms_scenarios (title, sender_number, message, is_phishing, difficulty_level, red_flags, explanation) VALUES
('Fake Bank SMS', '+1-555-0199', 'URGENT: Your bank account has been compromised. Click here to secure: https://bank-secure-now.com', 1, 'easy', '["Urgent language", "Suspicious link", "No bank name specified"]', 'This is a smishing attempt. Real banks never send security links via SMS. The urgent language and suspicious link are red flags.'),
('Legitimate 2FA Code', '+1-555-0123', 'Your verification code is: 123456. Do not share this code with anyone.', 0, 'easy', '[]', 'This is a legitimate 2FA code. Real verification codes are typically 6 digits and come from known services.');

INSERT INTO wifi_scenarios (title, network_name, security_type, signal_strength, is_phishing, difficulty_level, red_flags, explanation) VALUES
('Suspicious Free Wi-Fi', 'Free_WiFi_Here', 'Open', 85, 1, 'easy', '["Open network", "Generic name", "High signal strength"]', 'This is a potentially malicious Wi-Fi network. Open networks with generic names are often used for man-in-the-middle attacks.'),
('Legitimate Coffee Shop Wi-Fi', 'Starbucks_WiFi', 'WPA2', 70, 0, 'easy', '[]', 'This is a legitimate Wi-Fi network from a known business with proper security (WPA2).');


