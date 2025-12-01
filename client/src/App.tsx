import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameResults } from './types';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import GameMode from './pages/GameMode';
import EmailSimulation from './components/simulations/EmailSimulation';
import SMSSimulation from './components/simulations/SMSSimulation';
import WiFiSimulation from './components/simulations/WiFiSimulation';
import MixedSimulation from './components/simulations/MixedSimulation';
import Results from './pages/Results';
import Learn from './pages/Learn';
import Register from './pages/Register';

function AppContent() {
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Routes that should show the header (exclude simulation routes during gameplay)
  const isSimulationRoute = location.pathname.includes('/simulation/');
  const shouldShowHeader = (isAuthenticated || 
    location.pathname.includes('/game-mode') || 
    location.pathname.includes('/learn') || 
    location.pathname.includes('/results') || 
    location.pathname === '/home' || 
    location.pathname === '/dashboard') && !isSimulationRoute;

  const showStandaloneSpinner = isLoading && !shouldShowHeader;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Show Header for non-simulation routes */}
      {shouldShowHeader && <Header />}
      
      <main>
        {isLoading ? (
          <div className={`flex items-center justify-center ${shouldShowHeader ? 'min-h-[calc(100vh-64px)]' : 'min-h-screen'}`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Login />} />
            <Route
              path="/login"
              element={isAuthenticated ? <Dashboard /> : <Login />}
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/home" element={<Home />} />
            <Route path="/game-mode" element={<GameMode />} />
            <Route 
              path="/simulation/email" 
              element={<EmailSimulation onComplete={setGameResults} />} 
            />
            <Route 
              path="/simulation/sms" 
              element={<SMSSimulation onComplete={setGameResults} />} 
            />
            <Route 
              path="/simulation/wifi" 
              element={<WiFiSimulation onComplete={setGameResults} />} 
            />
            <Route 
              path="/simulation/normal" 
              element={<MixedSimulation onComplete={setGameResults} />} 
            />
            <Route 
              path="/simulation/mixed" 
              element={<MixedSimulation onComplete={setGameResults} />} 
            />
            <Route path="/results" element={<Results results={gameResults} />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        )}
      </main>

      {showStandaloneSpinner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
