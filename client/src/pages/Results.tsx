import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Target, Clock, TrendingUp, ArrowRight, RotateCcw, Home, User, Mail, X } from 'lucide-react';
import { GameResults } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ResultsProps {
  results: GameResults | null;
}

const Results: React.FC<ResultsProps> = ({ results }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '' });

  // Pre-fill with user info if available
  useEffect(() => {
    if (user) {
      if (user.firstName) setName(user.firstName);
      if (user.email) setEmail(user.email);
    } else {
      // Try to get from localStorage
      const savedUser = localStorage.getItem('phishhunt_user');
      const savedName = localStorage.getItem('scenarioName');
      const savedEmail = localStorage.getItem('scenarioEmail');
      
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      
      if (savedUser && !savedName) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.firstName) setName(parsed.firstName);
          if (parsed.email && !savedEmail) setEmail(parsed.email);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors = { name: '', email: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const getReplayRoute = (): string => {
    // Safety check - should never happen but TypeScript requires it
    if (!results) {
      return '/simulation/normal';
    }
    
    // Determine route based on results.type and results.mode
    if (results.mode === 'classic' || results.type === 'normal') {
      return '/simulation/normal';
    } else if (results.mode === 'mixed' || results.type === 'mixed') {
      return '/simulation/mixed';
    } else if (results.type === 'email' || results.mode === 'email') {
      return '/simulation/email';
    } else if (results.type === 'sms' || results.mode === 'sms') {
      return '/simulation/sms';
    } else if (results.type === 'wifi' || results.mode === 'wifi') {
      return '/simulation/wifi';
    }
    // Default fallback
    return '/simulation/normal';
  };

  const handleTryAgain = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Try Again clicked, showing modal');
    setShowModal(true);
  };

  const handleStart = () => {
    if (!validateForm()) {
      return;
    }

    // Save to localStorage for template variables
    localStorage.setItem('scenarioName', name.trim());
    localStorage.setItem('scenarioEmail', email.trim());

    // Update user data in localStorage (preserve firstName from account)
    const existingUser = localStorage.getItem('phishhunt_user');
    if (existingUser) {
      try {
        const userData = JSON.parse(existingUser);
        // Only update email for template variables, preserve firstName from account
        userData.email = email.trim();
        localStorage.setItem('phishhunt_user', JSON.stringify(userData));
      } catch (err) {
        // If parsing fails, just continue
      }
    }

    // Clear replay mode flag
    localStorage.removeItem('phishhunt_replay_mode');

    // Close modal and navigate to the appropriate route
    setShowModal(false);
    const route = getReplayRoute();
    
    // Set replay flag for classic mode
    if (route === '/simulation/normal') {
      localStorage.setItem('phishhunt_replay_mode', 'true');
      navigate(`${route}?replay=true`);
    } else {
      navigate(route);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setErrors({ name: '', email: '' });
  };

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return { message: "Excellent! You're a cybersecurity expert!", color: "text-success-600" };
    if (accuracy >= 80) return { message: "Great job! You have strong security awareness!", color: "text-success-600" };
    if (accuracy >= 70) return { message: "Good work! Keep practicing to improve further.", color: "text-primary-600" };
    if (accuracy >= 60) return { message: "Not bad! Review the explanations to learn more.", color: "text-yellow-600" };
    return { message: "Keep learning! Review the educational content.", color: "text-danger-600" };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      case 'wifi':
        return '📶';
      default:
        return '🎯';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Phishing';
      case 'sms':
        return 'SMS Smishing';
      case 'wifi':
        return 'Wi-Fi Wiphishing';
      default:
        return 'Mixed Training';
    }
  };

  const performance = getPerformanceMessage(results.accuracy);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{getTypeIcon(results.type)}</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Training Complete!
          </h1>
          <p className="text-xl text-gray-600">
            {getTypeName(results.type)} Simulation Results
          </p>
        </div>

        {/* Performance Overview */}
        <div className="card mb-8">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${performance.color}`}>
              <Trophy className="h-16 w-16 mx-auto" />
            </div>
            <h2 className={`text-3xl font-bold mb-4 ${performance.color}`}>
              {results.accuracy}% Accuracy
            </h2>
            <p className="text-xl text-gray-700 mb-8">{performance.message}</p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {results.correctAnswers}/{results.totalScenarios}
            </h3>
            <p className="text-gray-600">Correct Answers</p>
          </div>

          <div className="card text-center">
            <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {results.accuracy}%
            </h3>
            <p className="text-gray-600">Accuracy Rate</p>
          </div>

          <div className="card text-center">
            <div className="bg-danger-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-danger-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {Math.floor(results.totalTime / 60)}:{(results.totalTime % 60).toString().padStart(2, '0')}
            </h3>
            <p className="text-gray-600">Total Time</p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Total Scenarios</span>
              <span className="text-lg font-semibold text-gray-700">{results.totalScenarios}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
              <span className="font-medium text-gray-900">Correct Answers</span>
              <span className="text-lg font-semibold text-success-600">{results.correctAnswers}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-danger-50 rounded-lg">
              <span className="font-medium text-gray-900">Incorrect Answers</span>
              <span className="text-lg font-semibold text-danger-600">
                {results.totalScenarios - results.correctAnswers}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
              <span className="font-medium text-gray-900">Average Time per Scenario</span>
              <span className="text-lg font-semibold text-primary-600">
                {Math.round(results.totalTime / results.totalScenarios)}s
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="card mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Recommendations</h3>
          
          {results.accuracy < 80 ? (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">📚 Review Educational Content</h4>
                <p className="text-yellow-700">
                  Check out our learning section to understand common social engineering tactics and red flags.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🔄 Practice More</h4>
                <p className="text-blue-700">
                  Try different simulation types or repeat this training to improve your detection skills.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <h4 className="font-semibold text-success-800 mb-2">🎉 Great Job!</h4>
                <p className="text-success-700">
                  You have strong cybersecurity awareness! Consider trying mixed mode for a comprehensive challenge.
                </p>
              </div>
              
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h4 className="font-semibold text-primary-800 mb-2">🚀 Advanced Training</h4>
                <p className="text-primary-700">
                  Try other simulation types or mixed mode to test your skills across different attack vectors.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTryAgain();
            }}
            className="btn-primary flex items-center justify-center px-8 py-3 text-lg"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </button>
          
          <Link
            to="/learn"
            className="btn-secondary flex items-center justify-center px-8 py-3 text-lg"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Learn More
          </Link>
          
          <Link
            to="/"
            className="btn-secondary flex items-center justify-center px-8 py-3 text-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Home
          </Link>
        </div>
      </div>

      {/* Name and Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enter Your Information
            </h2>
            <p className="text-gray-600 mb-6">
              Please provide your name and email. These will be used to personalize the training scenarios.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
