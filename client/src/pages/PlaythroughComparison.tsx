import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PlaythroughComparison: React.FC = () => {
  const { user } = useAuth();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [comparisonPlaythroughs, setComparisonPlaythroughs] = useState<Array<{
    correct: number;
    wrong: number;
    emailPhishing: { correct: number; total: number };
    smsPhishing: { correct: number; total: number };
    wifiPhishing: { correct: number; total: number };
    session_type: string;
    completed_at: string;
  } | null>>([]);
  const [comparisonMode, setComparisonMode] = useState<'classic' | 'mixed'>('classic');
  const [isLoadingComparison, setIsLoadingComparison] = useState(true);
  const [progressTotals, setProgressTotals] = useState<{ total_correct: number; total_incorrect: number } | null>(null);
  const [progressByType, setProgressByType] = useState<{
    email: { correct: number; incorrect: number };
    sms: { correct: number; incorrect: number };
    wifi: { correct: number; incorrect: number };
  } | null>(null);

  // Fetch comparison playthroughs
  useEffect(() => {
    const fetchComparisonPlaythroughs = async () => {
      if (!user?.id) {
        setIsLoadingComparison(false);
        setComparisonPlaythroughs([]);
        return;
      }
      
      try {
        setIsLoadingComparison(true);
        const response = await fetch(`${apiUrl}/api/playthroughs/recent-completed/${user.id}?mode=${comparisonMode}`);
        
        if (response.status === 404) {
          setComparisonPlaythroughs([]);
          setIsLoadingComparison(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load comparison playthroughs (${response.status})`);
        }
        
        const result = await response.json();
        
        if (result?.playthroughs && result.playthroughs.length > 0) {
          const processed = result.playthroughs.map((item: any) => {
            const playthrough = item;
            const responses = item.responses || [];
            
            const accuracy = playthrough.accuracy || 0;
            
            // Group responses by scenario type
            const emailResponses = responses.filter((r: any) => r.scenario_type === 'email');
            const smsResponses = responses.filter((r: any) => r.scenario_type === 'sms');
            const wifiResponses = responses.filter((r: any) => r.scenario_type === 'wifi');
            
            const emailCorrect = emailResponses.filter((r: any) => r.is_correct).length;
            const smsCorrect = smsResponses.filter((r: any) => r.is_correct).length;
            const wifiCorrect = wifiResponses.filter((r: any) => r.is_correct).length;
            
            return {
              correct: Math.round(accuracy),
              wrong: Math.round(100 - accuracy),
              emailPhishing: { correct: emailCorrect, total: emailResponses.length },
              smsPhishing: { correct: smsCorrect, total: smsResponses.length },
              wifiPhishing: { correct: wifiCorrect, total: wifiResponses.length },
              session_type: playthrough.session_type,
              completed_at: playthrough.completed_at
            };
          });
          
          // Sort by completed_at to ensure: oldest first, newest last
          processed.sort((a: any, b: any) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
          
          // Ensure we have exactly 3 playthroughs (pad with null if needed)
          while (processed.length < 3) {
            processed.push(null);
          }
          
          setComparisonPlaythroughs(processed.slice(0, 3));
        } else {
          setComparisonPlaythroughs([null, null, null]);
        }
      } catch (error) {
        console.warn('Comparison playthroughs fetch error:', error);
        setComparisonPlaythroughs([null, null, null]);
      } finally {
        setIsLoadingComparison(false);
      }
    };

    fetchComparisonPlaythroughs();
  }, [apiUrl, user?.id, comparisonMode]);

  // Fetch progress totals and by type
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id) {
        setProgressTotals(null);
        setProgressByType(null);
        return;
      }
      
      try {
        // Fetch totals
        const totalsResponse = await fetch(`${apiUrl}/api/playthroughs/progress-totals/${user.id}`);
        if (!totalsResponse.ok) {
          throw new Error(`Failed to load progress totals (${totalsResponse.status})`);
        }
        const totalsResult = await totalsResponse.json();
        setProgressTotals({
          total_correct: totalsResult.total_correct || 0,
          total_incorrect: totalsResult.total_incorrect || 0
        });

        // Fetch by type
        const byTypeResponse = await fetch(`${apiUrl}/api/playthroughs/progress-by-type/${user.id}`);
        if (!byTypeResponse.ok) {
          throw new Error(`Failed to load progress by type (${byTypeResponse.status})`);
        }
        const byTypeResult = await byTypeResponse.json();
        // Ensure all values are numbers
        setProgressByType({
          email: {
            correct: Number(byTypeResult.email?.correct) || 0,
            incorrect: Number(byTypeResult.email?.incorrect) || 0
          },
          sms: {
            correct: Number(byTypeResult.sms?.correct) || 0,
            incorrect: Number(byTypeResult.sms?.incorrect) || 0
          },
          wifi: {
            correct: Number(byTypeResult.wifi?.correct) || 0,
            incorrect: Number(byTypeResult.wifi?.incorrect) || 0
          }
        });
      } catch (error) {
        console.warn('Progress data fetch error:', error);
        setProgressTotals({ total_correct: 0, total_incorrect: 0 });
        setProgressByType({
          email: { correct: 0, incorrect: 0 },
          sms: { correct: 0, incorrect: 0 },
          wifi: { correct: 0, incorrect: 0 }
        });
      }
    };

    fetchProgressData();
  }, [apiUrl, user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-green-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Review Previous Playthrough Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Review Previous Playthrough Comparison</h2>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setComparisonMode('classic')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  comparisonMode === 'classic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => setComparisonMode('mixed')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  comparisonMode === 'mixed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Mix
              </button>
            </div>
          </div>

          {isLoadingComparison ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {comparisonPlaythroughs.map((playthrough, index) => {
                const labels = ['First Playthrough', 'Second Recent Playthrough', 'Most Recent Playthrough'];
                
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{labels[index]}</h3>
                    
                    {playthrough ? (
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
                                strokeDasharray={`${(playthrough.correct / 100) * 251.2} 251.2`}
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
                                strokeDasharray={`${(playthrough.wrong / 100) * 251.2} 251.2`}
                                strokeDashoffset={`-${(playthrough.correct / 100) * 251.2}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-xl font-bold text-gray-800">{playthrough.correct}%</div>
                                <div className="text-xs text-gray-600">Correct</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center space-x-4 text-xs">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              <span>Correct {playthrough.correct}%</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                              <span>Wrong {playthrough.wrong}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Performance by Type */}
                        <div className="space-y-3 mb-4">
                          {/* Email Phishing */}
                          {playthrough.emailPhishing.total > 0 && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Email Phishing:</span>
                                <span>{playthrough.emailPhishing.correct}/{playthrough.emailPhishing.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${(playthrough.emailPhishing.correct / playthrough.emailPhishing.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* SMS Phishing */}
                          {playthrough.smsPhishing.total > 0 && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>SMS Phishing:</span>
                                <span>{playthrough.smsPhishing.correct}/{playthrough.smsPhishing.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${(playthrough.smsPhishing.correct / playthrough.smsPhishing.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Wi-Fi Phishing */}
                          {playthrough.wifiPhishing.total > 0 && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Wi-Fi Phishing:</span>
                                <span>{playthrough.wifiPhishing.correct}/{playthrough.wifiPhishing.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-500 h-1.5 rounded-full" 
                                  style={{ width: `${(playthrough.wifiPhishing.correct / playthrough.wifiPhishing.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No playthrough data available
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total Scenarios Summary */}
          {progressTotals && (
            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <div className="flex justify-center items-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">Total Correct: {progressTotals.total_correct}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">Total Incorrect: {progressTotals.total_incorrect}</div>
                </div>
              </div>
              
              {/* Breakdown by Scenario Type */}
              {progressByType && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Email Phishing</div>
                    <div className="text-lg font-bold text-green-600">Correct: {progressByType.email.correct}</div>
                    <div className="text-lg font-bold text-red-600">Incorrect: {progressByType.email.incorrect}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700 mb-2">SMS Phishing</div>
                    <div className="text-lg font-bold text-green-600">Correct: {progressByType.sms.correct}</div>
                    <div className="text-lg font-bold text-red-600">Incorrect: {progressByType.sms.incorrect}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Wi-Fi Phishing</div>
                    <div className="text-lg font-bold text-green-600">Correct: {progressByType.wifi.correct}</div>
                    <div className="text-lg font-bold text-red-600">Incorrect: {progressByType.wifi.incorrect}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaythroughComparison;

