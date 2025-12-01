import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, Mail, MessageSquare, Wifi, FileText, Paperclip, Link as LinkIcon, Shield, Lock, Clock, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EmailScenario, SMSScenario, WiFiScenario, GameResults, EmailLink } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useExitConfirmation } from '../../hooks/useExitConfirmation';
import ExitConfirmationModal from '../../components/ExitConfirmationModal';
import axios from 'axios';

// Declare process.env for TypeScript (available in Create React App)
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
  };
};

interface MixedScenario extends Partial<EmailScenario & SMSScenario & WiFiScenario> {
  type: 'email' | 'sms' | 'wifi';
}

interface MixedSimulationProps {
  onComplete: (results: GameResults) => void;
}

const MixedSimulation: React.FC<MixedSimulationProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<MixedScenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playthroughId, setPlaythroughId] = useState<number | null>(null);
  const [scenarioStartTime, setScenarioStartTime] = useState<number>(Date.now());
  const playthroughStartedRef = useRef<boolean>(false); // Prevent duplicate playthroughs
  // CRITICAL: Use composite key (type-id) because scenario IDs overlap across types (email 1-50, sms 1-30, wifi 1-15)
  const savedScenarioIdsRef = useRef<Set<string>>(new Set()); // Track which scenarios have been saved using "type-id" format
  const scenarioAnswersRef = useRef<Map<string, { answer: boolean; correctAnswer: boolean; startTime: number; answerTime: number }>>(new Map()); // Store answers using "type-id" format
  const navigate = useNavigate();
  const location = useLocation();
  const isNormalMode = location.pathname.includes('/normal');
  const isMixedMode = location.pathname.includes('/mixed');
  
  // Exit confirmation for refresh/back button
  const { showModal, handleConfirm: originalHandleConfirm, handleCancel, attemptNavigation } = useExitConfirmation({
    enabled: !loading && scenarios.length > 0
  });

  const handleConfirm = async () => {
    // Quit playthrough when user exits
    if (playthroughId) {
      await quitPlaythrough();
    }
    originalHandleConfirm();
  };

  // Timer effect
  useEffect(() => {
    if (loading || scenarios.length === 0) return;
    
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, scenarios.length, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get user info for template variables
  const userInfo = useMemo(() => {
    const savedUser = localStorage.getItem('phishhunt_user');
    let firstName = '';
    let email = '';

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        firstName = parsed.firstName || parsed.username || 'User';
        email = parsed.email || '';
      } catch (e) {
        console.warn('Failed to parse user from localStorage');
      }
    }

    if (user) {
      firstName = user.firstName || user.username || firstName || 'User';
      email = user.email || email;
    }

    // Fallback to localStorage scenarioName/scenarioEmail if available
    const scenarioName = localStorage.getItem('scenarioName');
    const scenarioEmail = localStorage.getItem('scenarioEmail');
    if (scenarioName) firstName = scenarioName;
    if (scenarioEmail) email = scenarioEmail;

    return { firstName, email };
  }, [user]);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const getStorageKey = () => {
    if (isNormalMode) return 'phishhunt_normal_used_scenarios';
    if (isMixedMode) return 'phishhunt_mixed_used_scenarios';
    return 'phishhunt_mixed_used_scenarios';
  };

  const getUsedScenarioIds = () => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          email: parsed.email || [],
          sms: parsed.sms || [],
          wifi: parsed.wifi || []
        };
      }
    } catch (error) {
      console.error('Error reading used scenarios:', error);
    }
    return { email: [], sms: [], wifi: [] };
  };

  const saveUsedScenarioIds = (scenarios: MixedScenario[]) => {
    const usedIds = {
      email: scenarios.filter(s => s.type === 'email').map(s => s.id),
      sms: scenarios.filter(s => s.type === 'sms').map(s => s.id),
      wifi: scenarios.filter(s => s.type === 'wifi').map(s => s.id)
    };
    localStorage.setItem(getStorageKey(), JSON.stringify(usedIds));
  };

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      let url = '';
      
      // Check if this is a replay (check URL params or localStorage flag)
      const urlParams = new URLSearchParams(window.location.search);
      const isReplay = urlParams.get('replay') === 'true' || localStorage.getItem('phishhunt_replay_mode') === 'true';
      
      // Clear replay flag if not a replay (fresh start)
      if (!isReplay && isNormalMode) {
        localStorage.removeItem('phishhunt_replay_mode');
      }
      
      if (isNormalMode) {
        // Classic mode: 12 email, 6 SMS, 2 WiFi
        // Only exclude previously used scenarios if this is a replay
        const params = new URLSearchParams();
        if (isReplay) {
          const usedIds = getUsedScenarioIds();
        if (usedIds.email.length > 0) params.append('excludeEmail', JSON.stringify(usedIds.email));
        if (usedIds.sms.length > 0) params.append('excludeSMS', JSON.stringify(usedIds.sms));
        if (usedIds.wifi.length > 0) params.append('excludeWiFi', JSON.stringify(usedIds.wifi));
        }
        
        url = `${apiUrl}/api/scenarios/normal${params.toString() ? '?' + params.toString() : ''}`;
      } else {
        // Mixed mode: all available scenarios (no exclusions, always show all)
        url = `${apiUrl}/api/scenarios/mixed`;
      }
      
      const response = await axios.get(url);
      const data = response.data;
      
      // Parse JSON fields if they're strings
      const parsedData = data.map((scenario: any) => {
        const parsed: MixedScenario = { ...scenario };
        
        // Convert is_phishing to boolean for all types (MySQL returns 0/1)
        const isPhishingValue = (parsed as any).is_phishing;
        if (typeof isPhishingValue === 'number') {
          parsed.is_phishing = isPhishingValue === 1;
        } else if (typeof isPhishingValue === 'string') {
          parsed.is_phishing = isPhishingValue === '1' || isPhishingValue.toLowerCase() === 'true';
        } else if (typeof isPhishingValue === 'boolean') {
          parsed.is_phishing = isPhishingValue;
        } else {
          parsed.is_phishing = false;
        }
        
        // Parse JSON fields for email scenarios
        if (parsed.type === 'email') {
          if (typeof parsed.template_variables === 'string') {
            try {
              parsed.template_variables = JSON.parse(parsed.template_variables);
            } catch (e) {
              parsed.template_variables = { variables: [] };
            }
          }
          
          if (typeof parsed.links === 'string') {
            try {
              parsed.links = JSON.parse(parsed.links);
            } catch (e) {
              parsed.links = null;
            }
          }
          
          if (typeof parsed.attachments === 'string') {
            try {
              parsed.attachments = JSON.parse(parsed.attachments);
            } catch (e) {
              parsed.attachments = null;
            }
          }
          
          if (typeof parsed.indicators === 'string') {
            try {
              parsed.indicators = JSON.parse(parsed.indicators);
            } catch (e) {
              parsed.indicators = null;
            }
          }

          // Backward compatibility
          if (!parsed.sender_name && parsed.sender) {
            parsed.sender_name = parsed.sender;
          }
          if (!parsed.sender_email && parsed.sender) {
            parsed.sender_email = parsed.sender;
          }
        }
        
        // Parse JSON fields for SMS scenarios
        if (parsed.type === 'sms') {
          if (typeof parsed.links === 'string') {
            try {
              parsed.links = JSON.parse(parsed.links);
            } catch (e) {
              parsed.links = null;
            }
          }
          
          if (typeof parsed.indicators === 'string') {
            try {
              parsed.indicators = JSON.parse(parsed.indicators);
            } catch (e) {
              parsed.indicators = null;
            }
          }

          // Backward compatibility
          if (!parsed.message_content && parsed.message) {
            parsed.message_content = parsed.message;
          }
        }
        
        // Parse JSON fields for WiFi scenarios
        if (parsed.type === 'wifi') {
          if (typeof parsed.indicators === 'string') {
            try {
              parsed.indicators = JSON.parse(parsed.indicators);
            } catch (e) {
              parsed.indicators = null;
            }
          }
        }
        
        return parsed;
      });
      
      // Validate that all scenarios have IDs
      const scenariosWithoutIds = parsedData.filter((s: MixedScenario) => !s.id);
      if (scenariosWithoutIds.length > 0) {
        console.error('❌ ERROR: Found scenarios without IDs from API:', scenariosWithoutIds.length, 'out of', parsedData.length);
        console.error('Scenarios without IDs:', scenariosWithoutIds.map((s: MixedScenario, idx: number) => ({
          index: parsedData.indexOf(s),
          type: s.type,
          hasSubject: !!(s as any).subject,
          hasMessage: !!(s as any).message_content,
          hasNetwork: !!(s as any).network_name
        })));
      } else {
        console.log('✅ All scenarios have IDs:', parsedData.length, 'scenarios');
      }
      
      setScenarios(parsedData);
      // Only save used scenario IDs for Classic mode when replaying (not Mixed mode, not first play)
      if (parsedData.length > 0 && isNormalMode) {
        const urlParams = new URLSearchParams(window.location.search);
        const isReplay = urlParams.get('replay') === 'true' || localStorage.getItem('phishhunt_replay_mode') === 'true';
        if (isReplay) {
          saveUsedScenarioIds(parsedData);
        }
      }
      
      setStartTime(Date.now());
      setScenarioStartTime(Date.now());
      
      // Reset saved scenarios tracking and answers
      savedScenarioIdsRef.current.clear();
      scenarioAnswersRef.current.clear();
      
      // Start playthrough (only once)
      if (parsedData.length > 0 && !playthroughStartedRef.current) {
        startPlaythrough();
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      // Fallback to empty array or show error
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  // Get indicators for current step
  const getIndicatorsForStep = (scenario: MixedScenario, step: number) => {
    const indicators = (scenario.indicators as any)?.indicators || [];
    return indicators.filter((ind: any) => ind.show_on_step === step);
  };

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const startPlaythrough = async () => {
    // Prevent duplicate playthroughs - use ref to track if we've already started
    if (playthroughStartedRef.current || playthroughId) {
      console.log('Playthrough already started, ID:', playthroughId);
      return;
    }
    
    playthroughStartedRef.current = true;
    
    try {
      const savedUser = localStorage.getItem('phishhunt_user');
      if (!savedUser) {
        console.warn('No user found in localStorage - playthrough will not be saved');
        return;
      }
      
      const user = JSON.parse(savedUser);
      
      // Only save playthroughs for logged-in users (not guests)
      if (user.isGuest) {
        console.log('Guest user detected - playthrough will not be saved. Please create an account to track your progress.');
        return;
      }
      
      const userId = user.id || user.userId;
      if (!userId) {
        console.warn('No user ID found:', user);
        return;
      }
      
      const sessionType = isNormalMode ? 'classic' : 'mixed';
      console.log('Starting playthrough for user:', userId, 'session type:', sessionType);
      const response = await axios.post(`${apiUrl}/api/playthroughs/start`, {
        userId: parseInt(userId),
        sessionType
      });
      
      if (response.data.success) {
        console.log('Playthrough started, ID:', response.data.playthroughId);
        setPlaythroughId(response.data.playthroughId);
      }
    } catch (error: any) {
      console.error('Failed to start playthrough:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  // Helper function to create composite key for scenarios (type-id) to handle overlapping IDs
  const getScenarioKey = (scenario: MixedScenario): string => {
    const scenarioType = scenario.type || 'email'; // Default fallback
    const scenarioId = scenario.id;
    if (!scenarioId) {
      console.error('Cannot create scenario key: scenario has no ID', scenario);
      return '';
    }
    return `${scenarioType}-${scenarioId}`;
  };

  const saveScenarioResponse = async (scenario: MixedScenario, userAnswer: boolean, correctAnswer: boolean, customStartTime?: number): Promise<boolean> => {
    // Only save if user is logged in (not a guest)
    const savedUser = localStorage.getItem('phishhunt_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.isGuest) {
        console.log('Guest user - response not saved. Create an account to track your progress.');
        return false;
      }
    }
    
    if (!playthroughId) {
      console.warn('Cannot save response: no playthroughId');
      return false;
    }
    if (!scenario) {
      console.warn('Cannot save response: no scenario');
      return false;
    }
    
    const scenarioId = scenario.id;
    if (!scenarioId) {
      console.warn('Cannot save response: scenario has no ID', scenario);
      return false;
    }
    
    // Use composite key to handle overlapping IDs across different scenario types
    const scenarioKey = getScenarioKey(scenario);
    if (!scenarioKey) {
      return false;
    }
    
    // Prevent duplicate saves - check if we've already saved this scenario
    if (savedScenarioIdsRef.current.has(scenarioKey)) {
      console.log('Scenario response already saved for scenario:', scenarioKey, 'Total saved so far:', savedScenarioIdsRef.current.size);
      return false;
    }
    
    try {
      // Calculate response time
      // If customStartTime is provided, we need the answer time too (stored in ref)
      let responseTime: number;
      if (customStartTime && scenario.id) {
        const storedAnswer = scenarioAnswersRef.current.get(scenarioKey);
        if (storedAnswer && storedAnswer.answerTime) {
          // Use stored answer time - start time for accurate response time
          responseTime = storedAnswer.answerTime - storedAnswer.startTime;
        } else {
          // Fallback: use current time (less accurate but better than nothing)
          responseTime = Date.now() - customStartTime;
        }
      } else {
        // Normal flow: use current scenarioStartTime
        responseTime = Date.now() - scenarioStartTime;
      }
      
      // Determine scenario type - check multiple possible fields
      let scenarioType = scenario.type;
      if (!scenarioType) {
        // Fallback: determine type based on scenario properties
        if ((scenario as any).sender || (scenario as any).subject) {
          scenarioType = 'email';
        } else if ((scenario as any).sender_number || (scenario as any).message_content) {
          scenarioType = 'sms';
        } else if ((scenario as any).network_name || (scenario as any).security_type) {
          scenarioType = 'wifi';
        } else {
          scenarioType = 'email'; // Default fallback
        }
      }
      
      console.log('Saving scenario response:', {
        playthroughId,
        scenarioType,
        scenarioId,
        scenarioData: { 
          hasSender: !!(scenario as any).sender,
          hasSenderNumber: !!(scenario as any).sender_number,
          hasNetworkName: !!(scenario as any).network_name,
          originalType: scenario.type
        },
        userAnswer,
        correctAnswer,
        responseTimeMs: responseTime
      });
      
      const response = await axios.post(`${apiUrl}/api/playthroughs/response`, {
        playthroughId,
        scenarioType,
        scenarioId,
        userAnswer,
        correctAnswer,
        responseTimeMs: responseTime
      });
      
      // Mark this scenario as saved using composite key
      savedScenarioIdsRef.current.add(scenarioKey);
      
      // CRITICAL: Ensure the answer is also stored in scenarioAnswersRef if it's not already there
      // This prevents the issue where a scenario is saved but the answer isn't in the ref
      if (!scenarioAnswersRef.current.has(scenarioKey)) {
        console.warn('⚠️ Scenario was saved but answer not in ref - storing it now:', scenarioKey);
        scenarioAnswersRef.current.set(scenarioKey, {
          answer: userAnswer,
          correctAnswer: correctAnswer,
          startTime: customStartTime || scenarioStartTime,
          answerTime: Date.now()
        });
      }
      
      console.log('✅ Scenario response saved successfully:', {
        scenarioId,
        scenarioType,
        playthroughId,
        userAnswer,
        correctAnswer,
        isCorrect: userAnswer === correctAnswer,
        totalSaved: savedScenarioIdsRef.current.size,
        savedIds: Array.from(savedScenarioIdsRef.current)
      });
      return true;
    } catch (error: any) {
      console.error('❌ Failed to save scenario response:', {
        scenarioId,
        error: error.message,
        response: error.response?.data
      });
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return false;
    }
  };

  const handleAnswer = (answer: boolean) => {
    const currentData = scenarios[currentScenario];
    const correctAnswer = currentData?.is_phishing;
    
    console.log('User answer:', answer, 'Correct answer:', correctAnswer, 'Type of correct answer:', typeof correctAnswer, 'scenarioId:', currentData?.id, 'scenarioIndex:', currentScenario);
    
    // Store the answer in ref so we can save it later if needed
    const answerTime = Date.now();
    if (currentData?.id) {
      const scenarioKey = getScenarioKey(currentData);
      if (scenarioKey) {
        scenarioAnswersRef.current.set(scenarioKey, {
          answer,
          correctAnswer: correctAnswer || false,
          startTime: scenarioStartTime,
          answerTime: answerTime
        });
        console.log('✅ Stored answer for scenario:', scenarioKey, 'Total stored:', scenarioAnswersRef.current.size, 'out of', scenarios.length);
      } else {
        console.error('❌ WARNING: Cannot create scenario key for scenario at index', currentScenario);
      }
    } else {
      console.error('❌ WARNING: Scenario at index', currentScenario, 'has no ID! Cannot store answer.', {
        scenario: currentData,
        hasId: !!currentData?.id,
        scenarioType: currentData?.type
      });
    }
    
    setUserAnswer(answer);
    setShowResult(true);
    setCurrentStep(1);
    
    // Ensure both are booleans for comparison
    const userAnswerBool = Boolean(answer);
    const correctAnswerBool = Boolean(correctAnswer);
    
    if (userAnswerBool === correctAnswerBool) {
      setScore(prevScore => prevScore + 1);
      console.log('Correct! Score updated.');
    } else {
      console.log('Incorrect answer.');
    }
  };

  const handleNextStep = async () => {
    const currentData = scenarios[currentScenario];
    if (!currentData) return;

    const indicators = (currentData.indicators as any)?.indicators || [];
    const maxStep = indicators.length > 0 
      ? Math.max(...indicators.map((ind: any) => ind.show_on_step))
      : 1;

    console.log('handleNextStep - currentStep:', currentStep, 'maxStep:', maxStep, 'userAnswer:', userAnswer, 'scenarioId:', currentData.id);

    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save scenario response after going through all indicators
      // IMPORTANT: Save BEFORE calling handleNext() which resets userAnswer
      if (userAnswer !== null && currentData) {
        console.log('All indicators shown, saving response for scenario:', currentData.id, 'type:', currentData.type, 'answer:', userAnswer);
        // Await the save to ensure it completes before moving to next scenario
        const saved = await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
        console.log('Save result:', saved ? 'Success' : 'Failed or skipped', 'Total saved so far:', savedScenarioIdsRef.current.size);
        // Small delay to ensure database commit
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        console.warn('Cannot save response: userAnswer is null or currentData is missing', {
          userAnswer,
          hasCurrentData: !!currentData,
          scenarioId: currentData?.id
        });
      }
      // Now move to next scenario (this will reset userAnswer)
      handleNext();
    }
  };

  const completePlaythrough = async () => {
    // Only save if user is logged in (not a guest)
    const savedUser = localStorage.getItem('phishhunt_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.isGuest) {
        console.log('Guest user - playthrough not saved. Create an account to track your progress.');
        return;
      }
    }
    
    if (!playthroughId) {
      console.warn('Cannot complete playthrough: no playthroughId');
      return;
    }
    
    try {
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log('Completing playthrough:', { playthroughId, totalTimeSeconds: totalTime });
      const response = await axios.post(`${apiUrl}/api/playthroughs/complete`, {
        playthroughId,
        totalTimeSeconds: totalTime
      });
      console.log('Playthrough completed successfully:', response.data);
    } catch (error: any) {
      console.error('Failed to complete playthrough:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  const quitPlaythrough = async () => {
    // Only save if user is logged in (not a guest)
    const savedUser = localStorage.getItem('phishhunt_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.isGuest) {
        console.log('Guest user - playthrough not saved. Create an account to track your progress.');
        return;
      }
    }
    
    if (!playthroughId) {
      console.warn('Cannot quit playthrough: no playthroughId');
      return;
    }
    
    try {
      console.log('🛑 Quitting playthrough - saving all answered scenarios...');
      
      // Save all scenario responses that have been answered but not yet saved
      const currentData = scenarios[currentScenario];
      
      // Check if current scenario has been answered but not saved
      if (currentData && currentData.id && userAnswer !== null) {
        const currentKey = getScenarioKey(currentData);
        if (currentKey) {
          const alreadySaved = savedScenarioIdsRef.current.has(currentKey);
          if (!alreadySaved) {
            console.log('💾 Saving current scenario response before quit:', currentKey, 'answer:', userAnswer);
            await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      // Save all other answered scenarios that haven't been saved yet
      const unsavedScenarios = scenarios.filter(s => {
        if (!s.id) return false;
        const key = getScenarioKey(s);
        return key && !savedScenarioIdsRef.current.has(key) && scenarioAnswersRef.current.has(key);
      });
      
      if (unsavedScenarios.length > 0) {
        console.log('💾 Saving', unsavedScenarios.length, 'unsaved scenario responses before quit...');
        for (const scenario of unsavedScenarios) {
          if (scenario.id) {
            const key = getScenarioKey(scenario);
            if (key) {
              const storedAnswer = scenarioAnswersRef.current.get(key);
              if (storedAnswer) {
                console.log('💾 Saving scenario response:', key, 'answer:', storedAnswer.answer);
                await saveScenarioResponse(scenario, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
          }
        }
      }
      
      console.log('📊 Quit summary - Total scenarios answered:', scenarioAnswersRef.current.size, 'Total saved:', savedScenarioIdsRef.current.size);
      
      // Wait a moment to ensure all saves are committed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log('🏁 Quitting playthrough with:', {
        playthroughId,
        totalTimeSeconds: totalTime,
        savedResponses: savedScenarioIdsRef.current.size
      });
      
      await axios.post(`${apiUrl}/api/playthroughs/quit`, {
        playthroughId,
        totalTimeSeconds: totalTime
      });
      
      console.log('✅ Playthrough quit successfully');
    } catch (error: any) {
      console.error('Failed to quit playthrough:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
    }
  };

  // Exit confirmation callback
  useEffect(() => {
    if (playthroughId) {
      // This will be called when user confirms exit
      const handleExit = () => {
        quitPlaythrough();
      };
      // Store in a way that can be accessed by the exit confirmation
      (window as any).__quitPlaythrough = handleExit;
    }
    return () => {
      delete (window as any).__quitPlaythrough;
    };
  }, [playthroughId]);

  const handleNext = async () => {
    const currentData = scenarios[currentScenario];
    
    // Check if this scenario has indicators
    const indicators = (currentData?.indicators as any)?.indicators || [];
    
    // If there are NO indicators, save the response here BEFORE moving to next
    // (Scenarios with indicators are saved in handleNextStep when all indicators are shown)
    if (currentData && userAnswer !== null && indicators.length === 0) {
      console.log('Saving response for scenario with no indicators:', currentData.id, 'type:', currentData.type, 'answer:', userAnswer);
      const saved = await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
      console.log('Save result for no-indicators scenario:', saved ? 'Success' : 'Failed or skipped', 'Total saved so far:', savedScenarioIdsRef.current.size);
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (currentScenario < scenarios.length - 1) {
      // Move to next scenario - reset state AFTER saving
      setCurrentScenario(currentScenario + 1);
      setUserAnswer(null);
      setShowResult(false);
      setCurrentStep(1);
      setScenarioStartTime(Date.now());
      console.log('Moved to next scenario:', currentScenario + 1, 'of', scenarios.length);
    } else {
      // Game completed - show saving progress and ensure ALL scenarios are saved
      setSavingProgress(true);
      console.log('🎮 Game completed! Ensuring all scenarios are saved...');
      
      try {
        // First, let's check the state of all scenarios
        const scenariosWithIds = scenarios.filter(s => s.id);
        const scenariosWithoutIds = scenarios.filter(s => !s.id);
        const allScenarioIdsList = scenariosWithIds.map(s => s.id!);
        
        console.log('🔍 Scenario analysis:', {
          totalScenarios: scenarios.length,
          scenariosWithIds: scenariosWithIds.length,
          scenariosWithoutIds: scenariosWithoutIds.length,
          totalAnswered: scenarioAnswersRef.current.size,
          alreadySaved: savedScenarioIdsRef.current.size,
          allScenarioIds: allScenarioIdsList.sort((a, b) => a - b),
          answeredKeys: Array.from(scenarioAnswersRef.current.keys()).sort(),
          savedKeys: Array.from(savedScenarioIdsRef.current).sort()
        });
        
        if (scenariosWithoutIds.length > 0) {
          console.error('❌ WARNING: Found scenarios without IDs:', scenariosWithoutIds.length, scenariosWithoutIds.map((s, idx) => ({ 
            index: scenarios.indexOf(s), 
            type: s.type,
            hasSubject: !!(s as any).subject,
            hasMessage: !!(s as any).message_content,
            hasNetwork: !!(s as any).network_name
          })));
        }
        
        // CRITICAL: The issue is that only 50 answers are stored but there are 95 scenarios
        // We need to save ALL scenarios that have stored answers, and also check if any scenarios
        // were answered but their answers weren't stored (maybe they were saved during gameplay)
        
        const scenariosWithAnswers = scenariosWithIds.filter(s => {
          if (!s.id) return false;
          const key = getScenarioKey(s);
          return key && scenarioAnswersRef.current.has(key);
        });
        
        const scenariosAlreadySaved = scenariosWithIds.filter(s => {
          if (!s.id) return false;
          const key = getScenarioKey(s);
          return key && savedScenarioIdsRef.current.has(key);
        });
        
        console.log('📊 Critical Analysis:', {
          totalScenarios: scenarios.length,
          scenariosWithIds: scenariosWithIds.length,
          scenariosWithStoredAnswers: scenariosWithAnswers.length,
          scenariosAlreadySaved: scenariosAlreadySaved.length,
          scenariosNeedingSave: scenariosWithAnswers.filter(s => {
            if (!s.id) return false;
            const key = getScenarioKey(s);
            return key && !savedScenarioIdsRef.current.has(key);
          }).length
        });
        
        // Save ALL scenarios that have stored answers AND are not already saved
        const scenariosToSave = scenariosWithAnswers.filter(s => {
          if (!s.id) return false;
          const key = getScenarioKey(s);
          return key && !savedScenarioIdsRef.current.has(key);
        });
        
        console.log('💾 Scenarios to save:', scenariosToSave.length, 'out of', scenariosWithAnswers.length, 'with stored answers');
        
        if (scenariosToSave.length > 0 && playthroughId) {
          console.warn('⚠️ Saving scenarios with stored answers that are not yet saved:', scenariosToSave.length);
          
          let savedCount = 0;
          let skippedError = 0;
          
          for (const scenario of scenariosToSave) {
            if (scenario.id) {
              const key = getScenarioKey(scenario);
              if (key) {
                const storedAnswer = scenarioAnswersRef.current.get(key);
                if (storedAnswer) {
                  console.log('💾 Saving scenario:', key, 'answer:', storedAnswer.answer);
                  const saved = await saveScenarioResponse(scenario, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
                  if (saved) {
                    savedCount++;
                  } else {
                    skippedError++;
                    console.warn('⚠️ Save returned false for scenario:', key, '- This should not happen as we filtered out already-saved scenarios');
                  }
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
              }
            }
          }
          console.log('💾 Batch save complete:', { 
            saved: savedCount, 
            skippedError: skippedError,
            total: scenariosToSave.length 
          });
        }
        
        // Check for scenarios that don't have stored answers - these were likely not answered
        const scenariosWithoutAnswers = scenariosWithIds.filter(s => {
          if (!s.id) return false;
          const key = getScenarioKey(s);
          return key && !scenarioAnswersRef.current.has(key) && !savedScenarioIdsRef.current.has(key);
        });
        
        if (scenariosWithoutAnswers.length > 0) {
          console.warn('⚠️ Found scenarios without stored answers:', scenariosWithoutAnswers.length, 'These scenarios were likely not answered by the user');
          console.log('Scenarios without answers (first 10):', scenariosWithoutAnswers.slice(0, 10).map(s => ({ id: s.id, type: s.type })));
        }
        
        // Ensure last scenario response is saved if it wasn't already
        if (currentData && currentData.id && playthroughId) {
          const currentKey = getScenarioKey(currentData);
          if (currentKey) {
            const alreadySaved = savedScenarioIdsRef.current.has(currentKey);
            if (!alreadySaved) {
              const storedAnswer = scenarioAnswersRef.current.get(currentKey);
              if (storedAnswer) {
                console.log('💾 Game ending - saving last scenario response:', currentKey);
                await saveScenarioResponse(currentData, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
                await new Promise(resolve => setTimeout(resolve, 300));
              } else if (userAnswer !== null) {
                console.log('💾 Game ending - saving last scenario response (using current userAnswer):', currentKey);
                await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
                await new Promise(resolve => setTimeout(resolve, 300));
              }
            } else {
              console.log('✅ Last scenario already saved:', currentKey);
            }
          }
        }
        
        // Final check: ensure ALL scenarios that were answered are saved
        // This includes scenarios that might have been answered but not yet saved
        const allAnsweredScenarioKeys = Array.from(scenarioAnswersRef.current.keys());
        const stillUnsaved = allAnsweredScenarioKeys.filter(key => !savedScenarioIdsRef.current.has(key));
        
        console.log('🔍 Final check - Answered scenarios:', {
          totalAnswered: allAnsweredScenarioKeys.length,
          alreadySaved: savedScenarioIdsRef.current.size,
          stillUnsaved: stillUnsaved.length,
          stillUnsavedKeys: stillUnsaved.sort()
        });
        
        if (stillUnsaved.length > 0 && playthroughId) {
          console.warn('⚠️ Found additional unsaved answered scenarios:', stillUnsaved.length);
          let additionalSaved = 0;
          for (const scenarioKey of stillUnsaved) {
            const storedAnswer = scenarioAnswersRef.current.get(scenarioKey);
            if (storedAnswer) {
              // Parse the key to find the scenario (format: "type-id")
              const [scenarioType, scenarioIdStr] = scenarioKey.split('-');
              const scenarioId = parseInt(scenarioIdStr, 10);
              const scenario = scenarios.find(s => s.id === scenarioId && s.type === scenarioType);
              if (scenario) {
                console.log('💾 Saving additional answered scenario:', scenarioKey, 'answer:', storedAnswer.answer);
                const saved = await saveScenarioResponse(scenario, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
                if (saved) {
                  additionalSaved++;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
              } else {
                console.error('❌ Scenario not found for key:', scenarioKey);
              }
            } else {
              console.error('❌ No stored answer found for scenario key:', scenarioKey);
            }
          }
          console.log('💾 Additional saves complete:', { saved: additionalSaved, total: stillUnsaved.length });
        }
        
        // Final verification: Check if we're missing any scenarios
        const allScenarioKeys = scenariosWithIds.map(s => getScenarioKey(s)).filter(key => key);
        const missingScenarios = allScenarioKeys.filter(key => !savedScenarioIdsRef.current.has(key));
        if (missingScenarios.length > 0) {
          console.warn('⚠️ WARNING: Some scenarios were never answered or saved:', {
            missingCount: missingScenarios.length,
            missingKeys: missingScenarios.sort(),
            note: 'These scenarios may not have been answered by the user'
          });
        }
        
        console.log('📊 Final save summary:', {
          totalScenarios: scenarios.length,
          totalAnswered: scenarioAnswersRef.current.size,
          totalSaved: savedScenarioIdsRef.current.size,
          savedKeys: Array.from(savedScenarioIdsRef.current).sort(),
          missingKeys: scenarios
            .map(s => getScenarioKey(s))
            .filter(key => key && !savedScenarioIdsRef.current.has(key))
            .sort(),
          expectedCount: scenarios.length,
          actualCount: savedScenarioIdsRef.current.size
        });
        
        // Wait a bit more to ensure all saves are committed
        await new Promise(resolve => setTimeout(resolve, 500));
        
      const endTime = Date.now();
      const totalTime = Math.round((endTime - startTime) / 1000);
        
        // Complete playthrough (await to ensure it finishes)
        console.log('🏁 Completing playthrough with:', {
          playthroughId,
          totalTimeSeconds: totalTime,
          expectedResponses: savedScenarioIdsRef.current.size
        });
        await completePlaythrough();
        
        // Wait a final moment to ensure playthrough completion is saved
        await new Promise(resolve => setTimeout(resolve, 300));
        
      const results: GameResults = {
        type: isNormalMode ? 'normal' : 'mixed',
        totalScenarios: scenarios.length,
        correctAnswers: score,
        accuracy: Math.round((score / scenarios.length) * 100),
        totalTime: totalTime,
          scenarios: scenarios as any[],
          mode: isNormalMode ? 'classic' : 'mixed'
        };
        onComplete(results);
        
        // Hide saving progress and navigate
        setSavingProgress(false);
        navigate('/results');
      } catch (error) {
        console.error('Error during save process:', error);
        setSavingProgress(false);
        // Still navigate even if there's an error
        const endTime = Date.now();
        const totalTime = Math.round((endTime - startTime) / 1000);
        const results: GameResults = {
          type: isNormalMode ? 'normal' : 'mixed',
          totalScenarios: scenarios.length,
          correctAnswers: score,
          accuracy: Math.round((score / scenarios.length) * 100),
          totalTime: totalTime,
          scenarios: scenarios as any[],
          mode: isNormalMode ? 'classic' : 'mixed'
      };
      onComplete(results);
      navigate('/results');
      }
    }
  };

  const currentData = scenarios[currentScenario];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scenarios...</p>
        </div>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No scenarios available.</p>
          <button
            onClick={() => navigate('/game-mode')}
            className="btn-primary"
          >
            Back to Game Mode
          </button>
        </div>
      </div>
    );
  }

  const formatDateTime = () => {
    return new Date().toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const applyUserVariables = (text?: string): string => {
    if (!text) return '';
    let processed = text;
    const safeName = userInfo.firstName || 'User';
    const safeEmail = userInfo.email || 'user@example.com';
    const dateTime = formatDateTime();

    processed = processed.replace(/\{\{(firstname|first_name|name)\}\}/gi, safeName);
    processed = processed.replace(/\{\{email\}\}/gi, safeEmail);
    processed = processed.replace(/\{\{(datetime|date_time|dateTime)\}\}/gi, dateTime);

    return processed;
  };

  // Replace template variables in content
  const replaceTemplateVariables = (content: string, variables: string[] = []): string => {
    if (!content) return '';
    let processed = content;
    
    variables.forEach((varName) => {
      const varLower = varName.toLowerCase();
      if (varLower === 'firstname' || varLower === 'first_name') {
        processed = processed.replace(/\{\{firstname\}\}/gi, userInfo.firstName);
        processed = processed.replace(/\{\{first_name\}\}/gi, userInfo.firstName);
      } else if (varLower === 'email') {
        processed = processed.replace(/\{\{email\}\}/gi, userInfo.email);
      } else if (varLower === 'datetime' || varLower === 'date_time') {
        processed = processed.replace(/\{\{datetime\}\}/gi, formatDateTime());
        processed = processed.replace(/\{\{date_time\}\}/gi, formatDateTime());
        processed = processed.replace(/\{\{dateTime\}\}/gi, formatDateTime());
      }
    });

    return applyUserVariables(processed);
  };

  // Parse and render email content with links
  const renderEmailContent = (scenario: EmailScenario): React.ReactNode => {
    let content = scenario.content;
    
    // Replace template variables
    if (scenario.template_variables?.variables) {
      content = replaceTemplateVariables(content, scenario.template_variables.variables);
    }

    // If there are links, we need to render them with hover tips
    const links = scenario.links?.links || [];
    
    if (links.length === 0) {
      return <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">{content}</div>;
    }

    // Find all link positions and sort by start index
    const linkPositions = links.map((link) => {
      const start = link.position?.start ?? content.indexOf(link.text);
      const end = link.position?.end ?? (start >= 0 ? start + link.text.length : -1);
      return { link, start, end };
    }).filter((pos) => pos.start >= 0 && pos.end <= content.length)
      .sort((a, b) => a.start - b.start);

    if (linkPositions.length === 0) {
      return <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">{content}</div>;
    }

    // Build array of text segments and link components
    const parts: (string | { type: 'link'; link: EmailLink })[] = [];
    let lastIndex = 0;

    linkPositions.forEach(({ link, start, end }) => {
      // Add text before this link
      if (start > lastIndex) {
        parts.push(content.substring(lastIndex, start));
      }
      
      // Add the link
      parts.push({ type: 'link', link });
      
      lastIndex = end;
    });

    // Add remaining text after last link
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            return <span key={index}>{part}</span>;
          } else {
            const { link } = part;
            return (
              <span key={index} className="relative group inline-block">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {link.text}
                </a>
                {link.show_hover_tip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-96 shadow-lg">
                    {link.hover_tip && (
                      <div className="mb-2 whitespace-normal text-center">{link.hover_tip}</div>
                    )}
                    <div className="text-blue-300 break-all whitespace-normal text-center">URL: {link.url}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </span>
            );
          }
        })}
      </div>
    );
  };

  // Parse and render SMS content with links
  const renderSMSContent = (scenario: SMSScenario): React.ReactNode => {
    let content = scenario.message_content || scenario.message || '';
    content = applyUserVariables(content);
    const links = scenario.links?.links || [];
    
    if (links.length === 0) {
      return <div className="text-sm text-gray-900 whitespace-pre-wrap">{content}</div>;
    }

    // Find links in the content by searching for the link text or URL
    const parts: (string | { type: 'link'; link: any })[] = [];
    let lastIndex = 0;

    links.forEach((link) => {
      // Try to find the link by text first, then by URL
      let linkIndex = content.indexOf(link.text, lastIndex);
      if (linkIndex === -1) {
        linkIndex = content.indexOf(link.url, lastIndex);
      }
      
      if (linkIndex >= 0) {
        // Add text before this link
        if (linkIndex > lastIndex) {
          parts.push(content.substring(lastIndex, linkIndex));
        }
        
        // Add the link
        parts.push({ type: 'link', link });
        
        // Update lastIndex to after the link
        lastIndex = linkIndex + (link.text.length || link.url.length);
      }
    });

    // Add remaining text after last link
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    // If no links were found, just return the content
    if (parts.length === 0) {
      return <div className="text-sm text-gray-900 whitespace-pre-wrap">{content}</div>;
    }

    return (
      <div className="text-sm text-gray-900 whitespace-pre-wrap">
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            return <span key={index}>{part}</span>;
          } else {
            const { link } = part;
            return (
              <span key={index} className="relative group inline-block">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {link.text}
                </a>
                {link.show_hover_tip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-96 shadow-lg">
                    {link.hover_tip && (
                      <div className="mb-2 whitespace-normal text-center">{link.hover_tip}</div>
                    )}
                    <div className="text-blue-300 break-all whitespace-normal text-center">URL: {link.url}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </span>
            );
          }
        })}
      </div>
    );
  };

  const renderScenarioContent = () => {
    switch (currentData.type) {
      case 'email':
        const emailData = currentData as EmailScenario;
        const attachments = emailData.attachments?.attachments || [];
        
        return (
          <div className="card">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center mb-2">
                <Mail className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Email Phishing Detection</h2>
              </div>
              <p className="text-gray-600">
                Examine this email carefully. Is it a legitimate email or a phishing attempt?
              </p>
            </div>

            {/* Logo if available */}
            {emailData.logo_url && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={emailData.logo_url} 
                  alt={emailData.title}
                  className="max-h-16 object-contain"
                />
              </div>
            )}

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-20">From:</span>
                  <span className="text-gray-900">
                    {emailData.sender_name || emailData.sender || 'Unknown'}
                    {emailData.sender_email && (
                      <span className="text-gray-600"> &lt;{emailData.sender_email}&gt;</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-20">Subject:</span>
                  <span className="text-gray-900">{emailData.subject}</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Paperclip className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Attachments ({attachments.length})</h3>
              </div>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center justify-between bg-white rounded p-3 border border-yellow-300"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-500 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{attachment.filename}</div>
                          <div className="text-sm text-gray-500">
                            {(attachment.filesize_bytes / 1024).toFixed(2)} KB
                            {attachment.contains_macros && (
                              <span className="ml-2 text-red-600 font-semibold">⚠ Contains Macros</span>
                            )}
                            {attachment.password_protected && (
                              <span className="ml-2 text-orange-600">🔒 Password Protected</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {attachment.hint && (
                        <div className="text-sm text-gray-600 italic">{attachment.hint}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
              {renderEmailContent(emailData)}
            </div>
          </div>
        );

      case 'sms':
        const smsData = currentData as SMSScenario;
        
        return (
          <div className="card">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center mb-2">
                <MessageSquare className="h-6 w-6 text-success-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">SMS Smishing Detection</h2>
              </div>
              <p className="text-gray-600">
                Examine this text message carefully. Is it legitimate or a smishing attempt?
              </p>
            </div>

            {/* Phone Interface */}
            <div className="bg-gray-900 rounded-3xl p-6 mx-auto max-w-sm mb-8">
              <div className="bg-white rounded-2xl p-4">
                {/* Phone Header */}
                <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Messages</span>
                </div>
                  <div className="text-xs text-gray-500">Now</div>
            </div>

                {/* SMS Message */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-600 mb-1 font-medium">{smsData.sender_number}</div>
                  <div className="text-sm text-gray-900">
                    {renderSMSContent(smsData)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'wifi':
        const wifiData = currentData as WiFiScenario;
        
        const getSignalBars = (strength: number) => {
          const bars = Math.ceil(strength / 20);
          return Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-1 ${
                i < bars ? 'bg-success-500' : 'bg-gray-300'
              } rounded-sm`}
              style={{ height: `${8 + i * 4}px` }}
            />
          ));
        };

        const getSecurityIcon = (securityType: string) => {
          switch (securityType.toLowerCase()) {
            case 'open':
              return <Wifi className="h-5 w-5 text-danger-500" />;
            case 'wpa2':
            case 'wpa3':
              return <Shield className="h-5 w-5 text-success-500" />;
            default:
              return <Lock className="h-5 w-5 text-gray-500" />;
          }
        };
        
        return (
          <div className="card">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center mb-2">
                <Wifi className="h-6 w-6 text-danger-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Wi-Fi Network Detection</h2>
              </div>
              <p className="text-gray-600">
                Examine this Wi-Fi network. Is it legitimate or a wiphishing attempt?
              </p>
            </div>

            {/* Context Description */}
            {wifiData.context_description && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-blue-600" />
                  Scenario Context
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {applyUserVariables(wifiData.context_description)}
                </p>
                </div>
            )}

            {/* Wi-Fi Network List Interface */}
            <div className="bg-gray-100 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Networks</h3>
              
              <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getSecurityIcon(wifiData.security_type)}
                    <div>
                      <div className="font-medium text-gray-900 text-lg">{wifiData.network_name}</div>
                      <div className="text-sm text-gray-500">{wifiData.security_type}</div>
                </div>
                    </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1 items-end">
                      {getSignalBars(wifiData.signal_strength)}
                    </div>
                    <span className="text-sm text-gray-500 font-medium">{wifiData.signal_strength}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ExitConfirmationModal
        isOpen={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      
      {/* Saving Progress Modal */}
      {savingProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Progress</h3>
              <p className="text-gray-600 text-center">Please wait while we save your results...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => attemptNavigation('/game-mode')}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors px-3 py-1 rounded hover:bg-red-50"
            >
              <XCircle className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">Exit Game</span>
            </button>
            <div className="text-lg font-semibold text-gray-900">
              {isNormalMode ? 'Classic Mode' : 'Mixed Training Mode'}
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">{formatTime(elapsedTime)}</span>
          </div>
          </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
              ></div>
            </div>
          <div className="text-center text-xs text-gray-500 mt-1">
            Scenario {currentScenario + 1} of {scenarios.length}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showResult ? (
          <>
            {renderScenarioContent()}
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => handleAnswer(false)}
                className="btn-success flex items-center justify-center px-8 py-3 text-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Legitimate
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="btn-danger flex items-center justify-center px-8 py-3 text-lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Phishing
              </button>
            </div>
          </>
        ) : (
          /* Results Display */
          <div className="card">
            <div className="text-center mb-6">
              {userAnswer === currentData.is_phishing ? (
                <div className="text-success-600 mb-4">
                  <CheckCircle className="h-16 w-16 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">Correct!</h3>
                </div>
              ) : (
                <div className="text-danger-600 mb-4">
                  <XCircle className="h-16 w-16 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">Incorrect</h3>
                </div>
              )}
            </div>

            {/* Overall Explanation */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-primary-600" />
                Explanation
              </h4>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                {(currentData as any).overall_explanation || currentData.explanation || 'No explanation available.'}
              </p>
              
              {(currentData as any).learning_points && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h5 className="font-semibold text-gray-900 mb-2">Learning Points:</h5>
                  <div className="text-gray-700 whitespace-pre-wrap">{(currentData as any).learning_points}</div>
                </div>
              )}
              
              {currentData.red_flags && JSON.parse(currentData.red_flags || '[]').length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h5 className="font-semibold text-gray-900 mb-2">Red Flags to Look For:</h5>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    {JSON.parse(currentData.red_flags || '[]').map((flag: string, index: number) => (
                      <li key={index}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Indicators for current step */}
            {(() => {
              const currentIndicators = getIndicatorsForStep(currentData, currentStep);
              const allIndicators = (currentData.indicators as any)?.indicators || [];
              const maxStep = allIndicators.length > 0 
                ? Math.max(...allIndicators.map((ind: any) => ind.show_on_step))
                : 1;

              if (currentIndicators.length === 0) return null;

              return (
                <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <LinkIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Indicators (Step {currentStep} of {maxStep})
                  </h4>
                  <div className="space-y-4">
                    {currentIndicators.map((indicator: any) => {
                      const severityColor = 
                        indicator.severity === 'high' ? 'text-red-600' :
                        indicator.severity === 'medium' ? 'text-orange-600' :
                        'text-yellow-600';
                      
                      const categoryColor = 
                        indicator.category === 'suspicious' || indicator.category === 'danger' ? 'bg-red-100 border-red-300' :
                        indicator.category === 'legitimate' ? 'bg-green-100 border-green-300' :
                        indicator.category === 'caution' ? 'bg-yellow-100 border-yellow-300' :
                        'bg-blue-100 border-blue-300';

                      return (
                        <div 
                          key={indicator.id} 
                          className={`${categoryColor} border rounded-lg p-4`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className={`font-semibold ${severityColor} flex items-center`}>
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {indicator.title}
                            </h5>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${severityColor} bg-white`}>
                              {indicator.severity.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{indicator.explanation}</p>
                          {indicator.recommendation && (
                            <p className="text-gray-600 text-sm italic mt-2">
                              <strong>Recommendation:</strong> {indicator.recommendation}
                            </p>
                          )}
                          {indicator.highlight_text && indicator.highlight_target !== 'none' && (() => {
                            const resolvedHighlight = applyUserVariables(indicator.highlight_text);
                            const displayText = resolvedHighlight || indicator.highlight_text;
                            return (
                            <div className="mt-2 text-xs text-gray-500">
                              Highlighted: <span className="font-mono bg-yellow-200 px-1 rounded">{displayText}</span>
                            </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              {(() => {
                const allIndicators = (currentData.indicators as any)?.indicators || [];
                const maxStep = allIndicators.length > 0 
                  ? Math.max(...allIndicators.map((ind: any) => ind.show_on_step))
                  : 1;

                if (currentStep < maxStep) {
                  return (
                    <button
                      onClick={handleNextStep}
                      className="btn-primary flex items-center px-8 py-3 text-lg"
                    >
                      Next Indicator
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </button>
                  );
                } else {
                  return (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center px-8 py-3 text-lg"
              >
                {currentScenario < scenarios.length - 1 ? 'Next Scenario' : 'View Results'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixedSimulation;

