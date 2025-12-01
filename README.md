# PhishHunt: A Randomized Web Simulation Game for Social Engineering Threat Detection

A comprehensive web-based simulation game designed to enhance cybersecurity awareness by training users to identify and respond to common social engineering attacks including phishing, smishing, and wiphishing.

## 🎯 Project Overview

**PhishHunt** is a Final Year Project by Venus Ong Jin Wen that provides interactive training scenarios to help users develop the skills needed to recognize and avoid social engineering attacks.

### Key Features

- **95+ Realistic Scenarios**: 50 email phishing, 30 SMS smishing, and 15 Wi-Fi wiphishing scenarios
- **Randomized Training**: Unique scenario sets for each playthrough
- **Performance Tracking**: Detailed analytics and scoring system
- **Educational Content**: Comprehensive learning resources and tips
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **Firebase** for storage and hosting
- **JWT** for authentication

### Development Tools
- **Visual Studio Code**
- **Nodemon** for development
- **Concurrently** for running multiple processes

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phishhunt
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up the database**
   ```bash
   # Create MySQL database
   mysql -u root -p < server/database/schema.sql
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   
   # Edit server/.env with your database credentials
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
phishhunt/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   └── simulations/ # Simulation components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app component
│   │   └── index.tsx      # Entry point
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── server/               # Node.js backend
│   ├── database/         # Database schema and migrations
│   ├── index.js          # Server entry point
│   └── package.json      # Backend dependencies
├── package.json          # Root package.json
└── README.md            # This file
```

## 🎮 Game Modes

### 1. Email Phishing Simulation
- Practice identifying suspicious emails
- Learn to spot fake sender addresses
- Recognize malicious links and attachments
- 50+ realistic email scenarios

### 2. SMS Smishing Simulation
- Train to identify suspicious text messages
- Learn to avoid clicking malicious links
- Recognize urgency tactics in SMS
- 30+ SMS scenarios

### 3. Wi-Fi Wiphishing Simulation
- Develop skills to identify malicious Wi-Fi networks
- Learn about man-in-the-middle attacks
- Practice safe Wi-Fi connection habits
- 15+ Wi-Fi scenarios

### 4. Mixed Training Mode
- Randomized scenarios from all three types
- Comprehensive cybersecurity training
- Ultimate challenge mode

## 📊 Scoring System

The game includes a sophisticated scoring system that tracks:

- **Accuracy Rate**: Percentage of correct identifications
- **Response Time**: Time taken to make decisions
- **Performance by Type**: Separate scores for each attack type
- **Learning Progress**: Improvement over time

## 🔒 Security Features

- **No Real Data**: All scenarios use simulated data
- **Educational Focus**: Designed for learning, not real threat detection
- **Safe Environment**: No actual malicious content
- **Privacy Protection**: No personal data collection

## 🎓 Educational Content

The application includes comprehensive learning resources:

- **Red Flags Guide**: Common indicators of social engineering attacks
- **Best Practices**: Security recommendations and tips
- **Attack Explanations**: Detailed explanations for each scenario
- **Interactive Learning**: Hands-on experience with immediate feedback

## 🚀 Deployment

### Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

### Environment Variables

Make sure to configure the following environment variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=phishhunt

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## 🤝 Contributing

This is a Final Year Project. For questions or suggestions, please contact:

**Venus Ong Jin Wen**
- Email: [tp065592@mail.apu.edu.my]
- University: [Asia Pacific University]

## 📄 License

This project is created for educational purposes as part of a Final Year Project. All rights reserved.

## 🙏 Acknowledgments

- Cybersecurity community for attack pattern research
- Open source libraries and frameworks used
- Educational institutions for cybersecurity awareness initiatives

---

**Remember**: This simulation is for educational purposes only. Always verify suspicious communications through official channels in real-world situations.


