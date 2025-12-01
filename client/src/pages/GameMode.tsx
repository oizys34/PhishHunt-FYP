import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Wifi, Shuffle, Clock, Target, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GameMode: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
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
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.firstName) setName(parsed.firstName);
          if (parsed.email) setEmail(parsed.email);
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

  const handleModeClick = (mode: string) => {
    setSelectedMode(mode);
    setShowModal(true);
  };

  const handleStart = () => {
    if (!validateForm()) {
      return;
    }

    // Save to localStorage for template variables
    localStorage.setItem('scenarioName', name.trim());
    localStorage.setItem('scenarioEmail', email.trim());

    // Close modal and navigate
    setShowModal(false);
    
    if (selectedMode) {
      navigate(selectedMode);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMode(null);
    setErrors({ name: '', email: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Training Mode
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Select a specific type of social engineering attack to practice, or try our mixed mode 
            for a comprehensive training experience.
          </p>
        </div>

        {/* Classic Mode - Large Card at Top */}
        <div className="card bg-gradient-to-r from-purple-600 to-purple-800 text-white mb-8">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Classic Mode</h3>
            <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
              20 questions of mixed 3 types of attack simulation: Email, SMS, and WiFi.
            </p>
            <div className="space-y-2 mb-8 text-sm text-purple-200">
              <div className="flex items-center justify-center">
                <Target className="h-4 w-4 mr-2" />
                <span>20 scenarios (12 Email, 7 SMS, 3 WiFi)</span>
              </div>
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>15-20 minutes</span>
              </div>
            </div>
            <button
              onClick={() => handleModeClick('/simulation/normal')}
              className="btn-primary bg-white text-purple-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
            >
              Start Classic Training
            </button>
          </div>
        </div>

        {/* Individual Game Modes Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {/* Email Phishing Mode */}
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Mail className="h-10 w-10 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Email Phishing</h3>
              <p className="text-gray-600 mb-6">
                Practice identifying suspicious emails, fake sender addresses, and malicious links.
              </p>
              <div className="space-y-2 mb-6 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  <span>50+ scenarios</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>10-15 minutes</span>
                </div>
              </div>
              <button
                onClick={() => handleModeClick('/simulation/email')}
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                Start Email Training
              </button>
            </div>
          </div>

          {/* SMS Smishing Mode */}
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="h-10 w-10 text-success-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">SMS Smishing</h3>
              <p className="text-gray-600 mb-6">
                Learn to spot suspicious text messages and avoid clicking malicious links.
              </p>
              <div className="space-y-2 mb-6 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  <span>30+ scenarios</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>8-12 minutes</span>
                </div>
              </div>
              <button
                onClick={() => handleModeClick('/simulation/sms')}
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                Start SMS Training
              </button>
            </div>
          </div>

          {/* Wi-Fi Wiphishing Mode */}
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="text-center">
              <div className="bg-danger-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Wifi className="h-10 w-10 text-danger-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Wi-Fi Wiphishing</h3>
              <p className="text-gray-600 mb-6">
                Develop skills to identify malicious Wi-Fi networks and protect yourself.
              </p>
              <div className="space-y-2 mb-6 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  <span>15+ scenarios</span>
                </div>
                <div className="flex items-center justify-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>5-8 minutes</span>
                </div>
              </div>
              <button
                onClick={() => handleModeClick('/simulation/wifi')}
                className="btn-primary w-full inline-flex items-center justify-center"
              >
                Start Wi-Fi Training
              </button>
            </div>
          </div>
        </div>

        {/* Mixed Mode */}
        <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white mb-12">
          <div className="text-center">
            <div className="bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Shuffle className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Mixed Training Mode</h3>
            <p className="text-xl text-primary-100 mb-6 max-w-2xl mx-auto">
              Experience all three types of social engineering attacks in a randomized sequence 
              for the ultimate cybersecurity training challenge.
            </p>
            <div className="space-y-2 mb-8 text-sm text-primary-200">
              <div className="flex items-center justify-center">
                <Target className="h-4 w-4 mr-2" />
                <span>95+ total scenarios</span>
              </div>
              <div className="flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>20-30 minutes</span>
              </div>
            </div>
            <button
              onClick={() => handleModeClick('/simulation/mixed')}
              className="btn-primary bg-white text-primary-600 hover:bg-gray-100 inline-flex items-center justify-center px-8 py-4 text-lg font-semibold"
            >
              Start Mixed Training
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Training Tips
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Take Your Time</h4>
              <p className="text-gray-600 text-sm">
                Don't rush through scenarios. Carefully examine each detail before making your decision.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Look for Red Flags</h4>
              <p className="text-gray-600 text-sm">
                Pay attention to urgent language, suspicious links, and unusual sender information.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Learn from Mistakes</h4>
              <p className="text-gray-600 text-sm">
                Review explanations after each scenario to understand why something was or wasn't a threat.
              </p>
            </div>
          </div>
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
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
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

export default GameMode;


