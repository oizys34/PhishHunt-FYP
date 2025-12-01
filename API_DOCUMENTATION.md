# PhishHunt API Documentation

## Database Structure

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for guest users
    is_guest BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    total_playthroughs INT DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0.00,
    total_correct_answers INT DEFAULT 0,
    total_questions_answered INT DEFAULT 0
);
```

### Playthroughs Table
```sql
CREATE TABLE playthroughs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_type ENUM('email', 'sms', 'wifi', 'mixed') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    total_scenarios INT NOT NULL,
    total_correct INT NOT NULL,
    total_incorrect INT NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL,
    total_time_seconds INT NOT NULL,
    average_response_time DECIMAL(8,2),
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Scenario Responses Table
```sql
CREATE TABLE scenario_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playthrough_id INT NOT NULL,
    scenario_type ENUM('email', 'sms', 'wifi') NOT NULL,
    scenario_id INT NOT NULL,
    user_answer BOOLEAN NOT NULL, -- true = user said phishing, false = user said legitimate
    correct_answer BOOLEAN NOT NULL, -- true = actually phishing, false = actually legitimate
    is_correct BOOLEAN NOT NULL, -- user_answer == correct_answer
    response_time_ms INT NOT NULL,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playthrough_id) REFERENCES playthroughs(id) ON DELETE CASCADE
);
```

### User Progress Table
```sql
CREATE TABLE user_progress (
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
    UNIQUE KEY unique_user_scenario (user_id, scenario_type)
);
```

## API Endpoints

### User Management

#### POST /api/users/register
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

#### POST /api/users/login
Login an existing user.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "isGuest": false
  }
}
```

#### POST /api/users/guest
Create a guest user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Guest user created",
  "token": "jwt_token",
  "user": {
    "id": 2,
    "username": "guest_1234567890",
    "email": "guest@phishhunt.com",
    "firstName": "Guest",
    "isGuest": true
  }
}
```

#### GET /api/users/profile/:userId
Get user profile with progress data.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "isGuest": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "totalPlaythroughs": 5,
    "bestAccuracy": 85.50,
    "totalCorrectAnswers": 17,
    "totalQuestionsAnswered": 20
  },
  "progress": [
    {
      "scenario_type": "email",
      "total_attempts": 10,
      "correct_answers": 8,
      "incorrect_answers": 2,
      "best_accuracy": 80.00,
      "average_response_time": 2200.00,
      "last_played": "2024-01-01T00:00:00.000Z"
    }
  ],
  "recentPlaythroughs": [
    {
      "id": 1,
      "session_type": "mixed",
      "started_at": "2024-01-01T00:00:00.000Z",
      "completed_at": "2024-01-01T00:20:00.000Z",
      "total_scenarios": 20,
      "total_correct": 17,
      "total_incorrect": 3,
      "accuracy": 85.00,
      "total_time_seconds": 1200,
      "average_response_time": 2500.50
    }
  ]
}
```

### Playthrough Management

#### POST /api/playthroughs/start
Start a new playthrough session.

**Request Body:**
```json
{
  "userId": 1,
  "sessionType": "mixed"
}
```

**Response:**
```json
{
  "success": true,
  "playthroughId": 1,
  "message": "Playthrough started"
}
```

#### POST /api/playthroughs/response
Record a user's response to a scenario.

**Request Body:**
```json
{
  "playthroughId": 1,
  "scenarioType": "email",
  "scenarioId": 1,
  "userAnswer": true,
  "correctAnswer": true,
  "responseTimeMs": 2500
}
```

**Response:**
```json
{
  "success": true,
  "message": "Response recorded"
}
```

#### POST /api/playthroughs/complete
Complete a playthrough and calculate final statistics.

**Request Body:**
```json
{
  "playthroughId": 1,
  "totalTimeSeconds": 1200
}
```

**Response:**
```json
{
  "success": true,
  "message": "Playthrough completed",
  "statistics": {
    "totalScenarios": 20,
    "totalCorrect": 17,
    "totalIncorrect": 3,
    "accuracy": 85.00,
    "averageResponseTime": 2500
  }
}
```

#### GET /api/playthroughs/history/:userId
Get user's playthrough history.

**Query Parameters:**
- `limit` (optional): Number of playthroughs to return (default: 10)
- `offset` (optional): Number of playthroughs to skip (default: 0)

**Response:**
```json
{
  "playthroughs": [
    {
      "id": 1,
      "session_type": "mixed",
      "started_at": "2024-01-01T00:00:00.000Z",
      "completed_at": "2024-01-01T00:20:00.000Z",
      "total_scenarios": 20,
      "total_correct": 17,
      "total_incorrect": 3,
      "accuracy": 85.00,
      "total_time_seconds": 1200,
      "average_response_time": 2500.50,
      "is_completed": true
    }
  ]
}
```

#### GET /api/playthroughs/results/:playthroughId
Get detailed results for a specific playthrough.

**Response:**
```json
{
  "playthrough": {
    "id": 1,
    "user_id": 1,
    "session_type": "mixed",
    "started_at": "2024-01-01T00:00:00.000Z",
    "completed_at": "2024-01-01T00:20:00.000Z",
    "total_scenarios": 20,
    "total_correct": 17,
    "total_incorrect": 3,
    "accuracy": 85.00,
    "total_time_seconds": 1200,
    "average_response_time": 2500.50,
    "is_completed": true
  },
  "responses": [
    {
      "id": 1,
      "playthrough_id": 1,
      "scenario_type": "email",
      "scenario_id": 1,
      "user_answer": true,
      "correct_answer": true,
      "is_correct": true,
      "response_time_ms": 2500,
      "answered_at": "2024-01-01T00:01:00.000Z",
      "email_title": "Urgent Bank Security Alert",
      "email_sender": "security@bankofamerica.com",
      "email_subject": "URGENT: Verify Your Account Immediately"
    }
  ]
}
```

#### GET /api/playthroughs/stats/:userId
Get comprehensive user statistics.

**Response:**
```json
{
  "userStats": {
    "total_playthroughs": 5,
    "best_accuracy": 85.50,
    "total_correct_answers": 17,
    "total_questions_answered": 20
  },
  "progress": [
    {
      "scenario_type": "email",
      "total_attempts": 10,
      "correct_answers": 8,
      "incorrect_answers": 2,
      "best_accuracy": 80.00,
      "average_response_time": 2200.00,
      "last_played": "2024-01-01T00:00:00.000Z"
    },
    {
      "scenario_type": "sms",
      "total_attempts": 7,
      "correct_answers": 5,
      "incorrect_answers": 2,
      "best_accuracy": 71.43,
      "average_response_time": 2800.00,
      "last_played": "2024-01-01T00:00:00.000Z"
    },
    {
      "scenario_type": "wifi",
      "total_attempts": 3,
      "correct_answers": 2,
      "incorrect_answers": 1,
      "best_accuracy": 66.67,
      "average_response_time": 2500.00,
      "last_played": "2024-01-01T00:00:00.000Z"
    }
  ],
  "recentPerformance": [
    {
      "session_type": "mixed",
      "accuracy": 85.00,
      "total_scenarios": 20,
      "total_correct": 17,
      "started_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Game Flow Example

### 1. User Registration/Login
```javascript
// Register new user
const registerResponse = await fetch('/api/users/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  })
});

// Or login existing user
const loginResponse = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});
```

### 2. Start Playthrough
```javascript
const startResponse = await fetch('/api/playthroughs/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    sessionType: 'mixed'
  })
});

const { playthroughId } = await startResponse.json();
```

### 3. Record Responses
```javascript
// For each scenario the user answers
const responseResponse = await fetch('/api/playthroughs/response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playthroughId: 1,
    scenarioType: 'email',
    scenarioId: 1,
    userAnswer: true, // user said it's phishing
    correctAnswer: true, // it actually is phishing
    responseTimeMs: 2500
  })
});
```

### 4. Complete Playthrough
```javascript
const completeResponse = await fetch('/api/playthroughs/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playthroughId: 1,
    totalTimeSeconds: 1200
  })
});

const { statistics } = await completeResponse.json();
// statistics contains: totalScenarios, totalCorrect, totalIncorrect, accuracy, averageResponseTime
```

### 5. Get User Progress
```javascript
const statsResponse = await fetch('/api/playthroughs/stats/1');
const userStats = await statsResponse.json();
// Contains comprehensive user statistics and progress by scenario type
```

## Database Relationships

```
users (1) -----> (many) playthroughs
users (1) -----> (many) user_progress
playthroughs (1) -----> (many) scenario_responses
```

## Key Features

1. **User Management**: Registration, login, guest users
2. **Progress Tracking**: Detailed statistics by scenario type
3. **Playthrough Recording**: Complete session tracking
4. **Response Analysis**: Individual scenario performance
5. **Historical Data**: Access to past playthroughs
6. **Real-time Updates**: Live progress tracking

## Security Considerations

1. **Password Hashing**: Uses bcrypt for secure password storage
2. **JWT Tokens**: Secure authentication tokens
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection Prevention**: Uses parameterized queries
5. **CORS Configuration**: Proper cross-origin resource sharing setup


