import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Play, BookOpen, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; username: string; email: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/users/profile/${user.id}`);
        if (!response.ok) {
          throw new Error(`Failed to load profile (${response.status})`);
        }
        const result = await response.json();
        if (result?.user) {
          setProfile({
            firstName: result.user.firstName || '',
            lastName: result.user.lastName || '',
            username: result.user.username || '',
            email: result.user.email || ''
          });
        }
      } catch (error) {
        console.warn('Profile fetch error:', error);
      }
    };

    fetchProfile();
  }, [apiUrl, user?.id]);

  const [scenarioName, setScenarioName] = useState('');
  const [scenarioEmail, setScenarioEmail] = useState('');
  const [formErrors, setFormErrors] = useState({ name: '', email: '' });
  const [lastPlaythrough, setLastPlaythrough] = useState<{
    correct: number;
    wrong: number;
    emailPhishing: { correct: number; total: number };
    smsPhishing: { correct: number; total: number };
    wifiPhishing: { correct: number; total: number };
  } | null>(null);
  const [isLoadingPlaythrough, setIsLoadingPlaythrough] = useState(true);

  const displayName = useMemo(() => {
    if (profile?.firstName?.trim()) return profile.firstName;
    if (profile?.username?.trim()) return profile.username;
    if (user?.firstName?.trim()) return user.firstName;
    if (user?.username?.trim()) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [profile, user]);

  // Fetch last completed playthrough
  useEffect(() => {
    const fetchLastPlaythrough = async () => {
      if (!user?.id) {
        setIsLoadingPlaythrough(false);
        setLastPlaythrough(null);
        return;
      }
      
      try {
        setIsLoadingPlaythrough(true);
        const response = await fetch(`${apiUrl}/api/playthroughs/last-completed/${user.id}`);
        
        // Handle 404 as "no playthrough found" (not an error)
        if (response.status === 404) {
          setLastPlaythrough(null);
          setIsLoadingPlaythrough(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load last playthrough (${response.status})`);
        }
        
        const result = await response.json();
        
        if (result?.playthrough && result?.responses) {
          const playthrough = result.playthrough;
          const responses = result.responses;
          
          // Calculate overall accuracy
          const totalCorrect = playthrough.total_correct || 0;
          const totalScenarios = playthrough.total_scenarios || 0;
          const totalIncorrect = playthrough.total_incorrect || 0;
          const accuracy = playthrough.accuracy || 0;
          
          // Group responses by scenario type and calculate performance
          const emailResponses = responses.filter((r: any) => r.scenario_type === 'email');
          const smsResponses = responses.filter((r: any) => r.scenario_type === 'sms');
          const wifiResponses = responses.filter((r: any) => r.scenario_type === 'wifi');
          
          const emailCorrect = emailResponses.filter((r: any) => r.is_correct).length;
          const smsCorrect = smsResponses.filter((r: any) => r.is_correct).length;
          const wifiCorrect = wifiResponses.filter((r: any) => r.is_correct).length;
          
          setLastPlaythrough({
            correct: Math.round(accuracy),
            wrong: Math.round(100 - accuracy),
            emailPhishing: { correct: emailCorrect, total: emailResponses.length },
            smsPhishing: { correct: smsCorrect, total: smsResponses.length },
            wifiPhishing: { correct: wifiCorrect, total: wifiResponses.length }
          });
        } else {
          setLastPlaythrough(null);
        }
      } catch (error) {
        console.warn('Last playthrough fetch error:', error);
        setLastPlaythrough(null);
      } finally {
        setIsLoadingPlaythrough(false);
      }
    };

    fetchLastPlaythrough();
  }, [apiUrl, user?.id]);

  const helpfulArticles = [
    {
      title: "Cybersecurity & Infrastructure Security Agency (CISA) - 'Avoiding Social Engineering and Phishing Attacks'",
      description: "Be cautious with unsolicited requests, verify links, use strong passwords, multi-factor authentication, install security tools, and report incidents."
    },
    {
      title: "Admin By Request - 'Don't Get Hooked: 10 Social Engineering Indicators'",
      description: "Learn to spot tell-tale signs like urgent requests, fake authority, odd attachments/links, unexpected communications, and emotional triggers."
    },
    {
      title: "Crowdstrike - How to Spot a Phishing Email",
      description: "Identify key signs in phishing emails such as suspicious links, fake domains, and urgent messages, and stay alert and report."
    }
  ];

  useEffect(() => {
    const storedName = localStorage.getItem('scenarioName');
    const storedEmail = localStorage.getItem('scenarioEmail');

    if (storedName) {
      setScenarioName(storedName);
    } else if (profile?.firstName) {
      setScenarioName(profile.firstName);
    } else if (displayName && displayName !== 'User') {
      setScenarioName(displayName);
    }

    if (storedEmail) {
      setScenarioEmail(storedEmail);
    } else if (profile?.email) {
      setScenarioEmail(profile.email);
    } else if (user?.email) {
      setScenarioEmail(user.email);
    }
  }, [profile, user?.email, displayName]);

  const validateForm = () => {
    const errors = { name: '', email: '' };
    let isValid = true;

    if (!scenarioName.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!scenarioEmail.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(scenarioEmail.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleStartGame = () => {
    if (!validateForm()) return;

    const trimmedName = scenarioName.trim();
    const trimmedEmail = scenarioEmail.trim();

    // Store name and email for template variables (separate from user account data)
    localStorage.setItem('scenarioName', trimmedName);
    localStorage.setItem('scenarioEmail', trimmedEmail);

    // Don't overwrite the user's saved firstName - only update email if needed for template variables
    // The Header should always use the user's account firstName, not the game mode name
    const existingUser = localStorage.getItem('phishhunt_user');
    if (existingUser) {
      try {
        const userData = JSON.parse(existingUser);
        // Only update email for template variables, preserve firstName from account
        userData.email = trimmedEmail;
        localStorage.setItem('phishhunt_user', JSON.stringify(userData));
      } catch (err) {
        // If parsing fails, just continue
      }
    }
    
    localStorage.removeItem('phishhunt_replay_mode');

    navigate('/simulation/normal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-green-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Last Playthrough */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Last Playthrough</h2>
            
            {isLoadingPlaythrough ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !lastPlaythrough ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed playthroughs yet.</p>
                <p className="text-sm text-gray-400 mt-2">Complete a classic or mixed mode game to see your stats here.</p>
              </div>
            ) : (
              <>
                {/* Overall Performance Pie Chart */}
                <div className="mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      {/* Correct answers arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeDasharray={`${(lastPlaythrough.correct / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                      {/* Wrong answers arc */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="8"
                        strokeDasharray={`${(lastPlaythrough.wrong / 100) * 251.2} 251.2`}
                        strokeDashoffset={`-${(lastPlaythrough.correct / 100) * 251.2}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{lastPlaythrough.correct}%</div>
                        <div className="text-sm text-gray-600">Correct</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Correct {lastPlaythrough.correct}%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span>Wrong {lastPlaythrough.wrong}%</span>
                    </div>
                  </div>
                </div>

                {/* Performance by Type */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Performance by Type</h3>
                  
                  {/* Email Phishing */}
                  {lastPlaythrough.emailPhishing.total > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Email Phishing:</span>
                        <span>{lastPlaythrough.emailPhishing.correct}/{lastPlaythrough.emailPhishing.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(lastPlaythrough.emailPhishing.correct / lastPlaythrough.emailPhishing.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* SMS Phishing */}
                  {lastPlaythrough.smsPhishing.total > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>SMS Phishing:</span>
                        <span>{lastPlaythrough.smsPhishing.correct}/{lastPlaythrough.smsPhishing.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(lastPlaythrough.smsPhishing.correct / lastPlaythrough.smsPhishing.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Wi-Fi Phishing */}
                  {lastPlaythrough.wifiPhishing.total > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Wi-Fi Phishing:</span>
                        <span>{lastPlaythrough.wifiPhishing.correct}/{lastPlaythrough.wifiPhishing.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(lastPlaythrough.wifiPhishing.correct / lastPlaythrough.wifiPhishing.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Center Panel - Welcome and Input */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome Back {displayName}
          </h1>
              <p className="text-gray-600">Ready to test your social engineering threat detection skills?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insert a name here:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-2">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insert an email here:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={scenarioEmail}
                    onChange={(e) => setScenarioEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600 mt-2">{formErrors.email}</p>
                )}
              </div>

              <button
                onClick={handleStartGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Classic Mode
              </button>
            </div>
          </div>

          {/* Right Panel - Helpful Articles */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Helpful Articles</h2>
            
            <div className="space-y-4">
              {helpfulArticles.map((article, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <h3 className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer underline mb-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {article.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link 
                to="/learn" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View All Articles
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">95+</div>
            <div className="text-sm text-gray-600">Total Scenarios</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">80%</div>
            <div className="text-sm text-gray-600">Average Accuracy</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">3</div>
            <div className="text-sm text-gray-600">Attack Types</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">15+</div>
            <div className="text-sm text-gray-600">Learning Resources</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
