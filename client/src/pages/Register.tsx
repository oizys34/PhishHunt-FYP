import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

const Register: React.FC = () => {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailConflict, setEmailConflict] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const { register, isLoading, checkUsernameAvailability, generateUsernameFromEmail } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: keyof typeof formValues) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = event.target.value;

    if (field === 'username') {
      value = value.replace(/\s+/g, '').toLowerCase();
    }
    if (field === 'email') {
      setEmailConflict(false);
    }

    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setEmailConflict(false);

    const { firstName, lastName, username, email, password, confirmPassword } = formValues;

    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (usernameStatus !== 'available') {
      setError('Please choose an available username.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please confirm your password.');
      return;
    }

    const payload: RegisterData = {
      firstName,
      lastName,
      email,
      password,
      username
    };

    try {
      const success = await register(payload);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Unable to create account at this time. Please try again.');
      }
    } catch (registerError) {
      if (registerError instanceof Error) {
        if (registerError.message === 'EMAIL_EXISTS') {
          setEmailConflict(true);
          setError('This email is already registered. Please sign in instead.');
          return;
        }
        if (registerError.message === 'USERNAME_EXISTS') {
          setUsernameStatus('taken');
          setError('Username already taken. Please choose a different one.');
          return;
        }
      }
      setError('Unable to create account at this time. Please try again.');
    }
  };

  const location = useLocation() as { state?: { prefillEmail?: string } };

  useEffect(() => {
    const prefillEmail = location.state?.prefillEmail;
    if (prefillEmail && prefillEmail !== formValues.email) {
      setFormValues(prev => ({
        ...prev,
        email: prefillEmail
      }));
    }
  }, [location.state, formValues.email]);

  useEffect(() => {
    if (location.state?.prefillEmail) {
      setFormValues(prev => ({
        ...prev,
        email: location.state?.prefillEmail ?? prev.email
      }));
    }
  }, [location.state]);

  useEffect(() => {
    const controller = new AbortController();
    const { username } = formValues;

    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');

    const timeout = setTimeout(async () => {
      const available = await checkUsernameAvailability(username);
      if (!controller.signal.aborted) {
        setUsernameStatus(available ? 'available' : 'taken');
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formValues.username, checkUsernameAvailability]);

  useEffect(() => {
    let cancelled = false;

    const suggestUsername = async () => {
      if (!formValues.email || formValues.username) {
        return;
      }
      const suggestion = await generateUsernameFromEmail(formValues.email);
      if (!cancelled) {
        setFormValues(prev => ({
          ...prev,
          username: suggestion
        }));
      }
    };

    void suggestUsername();

    return () => {
      cancelled = true;
    };
  }, [formValues.email, formValues.username, generateUsernameFromEmail]);

  const usernameValue = formValues.username;

  const usernameHelperText = useMemo(() => {
    switch (usernameStatus) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Username is available!';
      case 'taken':
        return 'Username is already taken. Please choose another.';
      default:
        if (usernameValue && usernameValue.length < 3) {
          return 'Username must be at least 3 characters long.';
        }
        return 'Username must be unique.';
    }
  }, [usernameStatus, usernameValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-800 italic mb-2">PhishHunt</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Create your account</h2>
          <p className="text-gray-600 text-sm leading-relaxed max-w-xl mx-auto">
            Join PhishHunt to practice identifying and defending against social engineering attacks
            through immersive and realistic simulations.
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    value={formValues.firstName}
                    onChange={handleChange('firstName')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="lastName"
                    type="text"
                    value={formValues.lastName}
                    onChange={handleChange('lastName')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-2">
                Username:
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="register-username"
                  type="text"
                  value={formValues.username}
                  onChange={handleChange('username')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    usernameStatus === 'taken'
                      ? 'border-red-300'
                      : usernameStatus === 'available'
                      ? 'border-green-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="Choose a unique username"
                  required
                />
              </div>
              <p
                className={`mt-1 text-xs ${
                  usernameStatus === 'available'
                    ? 'text-green-600'
                    : usernameStatus === 'taken'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {usernameHelperText}
              </p>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email:
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="register-email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange('email')}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    emailConflict ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {emailConflict && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  This email is already registered.{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { prefillEmail: formValues.email } })}
                    className="underline font-medium"
                  >
                    Sign in instead
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formValues.password}
                    onChange={handleChange('password')}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formValues.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

