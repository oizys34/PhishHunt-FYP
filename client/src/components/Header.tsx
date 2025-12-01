import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Home, Gamepad2, BookOpen, LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileFirstName, setProfileFirstName] = useState<string | null>(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch user's saved firstName from database if logged in
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id || user.isGuest) {
        setProfileFirstName(null);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/api/users/profile/${user.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result?.user?.firstName) {
            setProfileFirstName(result.user.firstName);
          }
        }
      } catch (error) {
        // Silently fail - will fall back to user.firstName
      }
    };

    fetchProfile();
  }, [user?.id, user?.isGuest, apiUrl]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Use profile firstName (from database) if available, otherwise fall back to user.firstName
  const displayName = profileFirstName || user?.firstName || user?.username || 'User';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">PhishHunt</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/game-mode"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/game-mode') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span>Play Game</span>
            </Link>
            
            <Link
              to="/learn"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/learn') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Learn</span>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{displayName}</span>
              </div>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
