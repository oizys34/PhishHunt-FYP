import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCreateAccountPrompt, setShowCreateAccountPrompt] = useState(false);
  const {
    login,
    guestLogin,
    isLoading,
    generateUsernameFromEmail,
    loginWithGoogle
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { prefillEmail?: string } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        setShowCreateAccountPrompt(false);
        navigate('/dashboard', { replace: true });
      } else {
        setShowCreateAccountPrompt(false);
        setError('Incorrect email or password. Please try again.');
      }
    } catch (loginError) {
      if (loginError instanceof Error) {
        if (loginError.message === 'USER_NOT_FOUND') {
          setError('We couldn’t find an account with that email.');
          setShowCreateAccountPrompt(true);
          return;
        }
        if (loginError.message === 'INVALID_PASSWORD') {
          setShowCreateAccountPrompt(false);
          setError('Incorrect email or password. Please try again.');
          return;
        }
        if (loginError.message === 'INVALID_CREDENTIALS') {
          setShowCreateAccountPrompt(false);
          setError('Incorrect email or password. Please try again.');
          return;
        }
      }
      setError('Unable to sign in right now. Please try again.');
    }
  };

  useEffect(() => {
    if (location.state?.prefillEmail) {
      setEmail(location.state.prefillEmail);
    }
  }, [location.state]);

  const handleGuestLogin = async () => {
    setError('');
    try {
      const success = await guestLogin();
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Unable to sign in as guest. Please try again.');
      }
    } catch {
      setError('Unable to sign in as guest. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      if (!googleUser.email) {
        setError('Google account is missing an email. Please use a different account.');
        return;
      }

      const displayName = googleUser.displayName || '';
      const [firstName = '', lastName = ''] = displayName.split(' ');

      const suggestedUsername = await generateUsernameFromEmail(googleUser.email);

      const success = await loginWithGoogle({
        email: googleUser.email,
        firstName,
        lastName,
        googleId: googleUser.uid,
        username: suggestedUsername
      });

      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (googleError) {
      console.error('Google login error:', googleError);
      setError('Unable to sign in with Google right now.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-800 italic mb-2">PhishHunt</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Welcome to PhishHunt</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            A social engineering threat detection simulation game to test how easily you can fall victim to social engineering attacks.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {showCreateAccountPrompt && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex flex-col space-y-2">
              <span>We couldn’t find an account with that email.</span>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateAccountPrompt(false);
                    navigate('/register', { state: { prefillEmail: email } });
                  }}
                  className="btn-primary px-4 py-2"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAccountPrompt(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password:
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Alternative Login Options */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleGuestLogin}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <User className="h-5 w-5 mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Continue as Guest</span>
              </button>

              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
