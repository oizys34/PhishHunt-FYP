import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, CheckCircle, XCircle, AlertTriangle, FileText, Link as LinkIcon, Paperclip, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmailScenario, GameResults, EmailLink, EmailAttachment, EmailIndicator } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useExitConfirmation } from '../../hooks/useExitConfirmation';
import ExitConfirmationModal from '../../components/ExitConfirmationModal';
import axios from 'axios';

interface EmailSimulationProps {
  onComplete: (results: GameResults) => void;
}

const EmailSimulation: React.FC<EmailSimulationProps> = ({ onComplete }) => {
  console.log('EmailSimulation component mounted');
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<EmailScenario[]>([]);
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
  const playthroughStartingRef = useRef<boolean>(false); // Track if we're currently in the process of starting (prevents concurrent calls)
  const savedScenarioIdsRef = useRef<Set<number>>(new Set()); // Track which scenarios have been saved
  const scenarioAnswersRef = useRef<Map<number, { answer: boolean; correctAnswer: boolean; startTime: number; answerTime: number }>>(new Map()); // Store answers for all scenarios
  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
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
    const dateTime = formatDateTime();
    
    // Always replace dateTime even if not in variables array
    processed = processed.replace(/\{\{datetime\}\}/gi, dateTime);
    processed = processed.replace(/\{\{dateTime\}\}/gi, dateTime);
    processed = processed.replace(/\{\{date_time\}\}/gi, dateTime);
    
    variables.forEach((varName) => {
      const varLower = varName.toLowerCase();
      if (varLower === 'firstname' || varLower === 'first_name') {
        processed = processed.replace(/\{\{firstname\}\}/gi, userInfo.firstName);
        processed = processed.replace(/\{\{first_name\}\}/gi, userInfo.firstName);
      } else if (varLower === 'email') {
        processed = processed.replace(/\{\{email\}\}/gi, userInfo.email);
      } else if (varLower === 'datetime' || varLower === 'date_time') {
        processed = processed.replace(/\{\{datetime\}\}/gi, dateTime);
        processed = processed.replace(/\{\{dateTime\}\}/gi, dateTime);
        processed = processed.replace(/\{\{date_time\}\}/gi, dateTime);
      }
    });

    return applyUserVariables(processed);
  };

  // Parse and render content with links
  const renderEmailContent = (scenario: EmailScenario): React.ReactNode => {
    let content = scenario.content;
    
    // Replace template variables (always replace dateTime even if not in variables array)
    if (scenario.template_variables?.variables) {
      content = replaceTemplateVariables(content, scenario.template_variables.variables);
    } else {
      // Still replace dateTime even if no variables array
      content = replaceTemplateVariables(content, []);
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
                    // Show hover tip or URL preview
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

  // Get indicators for current step
  const getIndicatorsForStep = (scenario: EmailScenario, step: number): EmailIndicator[] => {
    const indicators = scenario.indicators?.indicators || [];
    return indicators.filter((ind) => ind.show_on_step === step);
  };

  const startPlaythrough = async () => {
    // Prevent duplicate playthroughs - check both refs and playthroughId
    if (playthroughStartedRef.current || playthroughId || playthroughStartingRef.current) {
      console.log('Playthrough already started or starting, ID:', playthroughId, 'started:', playthroughStartedRef.current, 'starting:', playthroughStartingRef.current);
      return;
    }
    
    // Set both refs immediately to prevent concurrent calls
    playthroughStartedRef.current = true;
    playthroughStartingRef.current = true;
    
    try {
      const savedUser = localStorage.getItem('phishhunt_user');
      if (!savedUser) {
        console.warn('No user found in localStorage - playthrough will not be saved');
        playthroughStartedRef.current = false; // Reset on failure
        playthroughStartingRef.current = false;
        return;
      }
      
      const user = JSON.parse(savedUser);
      
      // Only save playthroughs for logged-in users (not guests)
      if (user.isGuest) {
        console.log('Guest user detected - playthrough will not be saved. Please create an account to track your progress.');
        playthroughStartedRef.current = false; // Reset for guest users
        playthroughStartingRef.current = false;
        return;
      }
      
      const userId = user.id || user.userId;
      if (!userId) {
        console.warn('No user ID found:', user);
        playthroughStartedRef.current = false; // Reset on failure
        playthroughStartingRef.current = false;
        return;
      }
      
      console.log('Starting playthrough for user:', userId, 'session type: email');
      const response = await axios.post(`${apiUrl}/api/playthroughs/start`, {
        userId: parseInt(userId),
        sessionType: 'email'
      });
      
      if (response.data.success) {
        console.log('Playthrough started, ID:', response.data.playthroughId);
        setPlaythroughId(response.data.playthroughId);
        // Keep playthroughStartedRef as true, but clear the starting flag
        playthroughStartingRef.current = false;
      } else {
        // If API call succeeded but didn't return success, reset both refs
        playthroughStartedRef.current = false;
        playthroughStartingRef.current = false;
      }
    } catch (error: any) {
      console.error('Failed to start playthrough:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      // Reset both refs on error so user can retry
      playthroughStartedRef.current = false;
      playthroughStartingRef.current = false;
    }
  };

  const saveScenarioResponse = async (scenario: EmailScenario, userAnswer: boolean, correctAnswer: boolean, customStartTime?: number): Promise<boolean> => {
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
    
    // Prevent duplicate saves - check if we've already saved this scenario
    if (savedScenarioIdsRef.current.has(scenarioId)) {
      console.log('Scenario response already saved for scenario:', scenarioId, 'Total saved so far:', savedScenarioIdsRef.current.size);
      return false;
    }
    
    try {
      // Calculate response time
      let responseTime: number;
      if (customStartTime && scenario.id) {
        const storedAnswer = scenarioAnswersRef.current.get(scenario.id);
        if (storedAnswer && storedAnswer.answerTime) {
          responseTime = storedAnswer.answerTime - customStartTime;
        } else {
          responseTime = Date.now() - customStartTime;
        }
      } else {
        responseTime = Date.now() - scenarioStartTime;
      }
      
      console.log('Saving scenario response:', {
        playthroughId,
        scenarioType: 'email',
        scenarioId,
        userAnswer,
        correctAnswer,
        responseTimeMs: responseTime
      });
      
      const response = await axios.post(`${apiUrl}/api/playthroughs/response`, {
        playthroughId,
        scenarioType: 'email',
        scenarioId: scenario.id,
        userAnswer,
        correctAnswer,
        responseTimeMs: responseTime
      });
      
      // Mark this scenario as saved
      savedScenarioIdsRef.current.add(scenarioId);
      
      console.log('✅ Scenario response saved successfully:', {
        scenarioId,
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
        const alreadySaved = savedScenarioIdsRef.current.has(currentData.id);
        if (!alreadySaved) {
          console.log('💾 Saving current scenario response before quit:', currentData.id, 'type: email', 'answer:', userAnswer);
          await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Save all other answered scenarios that haven't been saved yet
      const unsavedScenarios = scenarios.filter(s => {
        if (!s.id) return false;
        return !savedScenarioIdsRef.current.has(s.id) && scenarioAnswersRef.current.has(s.id);
      });
      
      if (unsavedScenarios.length > 0) {
        console.log('💾 Saving', unsavedScenarios.length, 'unsaved scenario responses before quit...');
        for (const scenario of unsavedScenarios) {
          if (scenario.id) {
            const storedAnswer = scenarioAnswersRef.current.get(scenario.id);
            if (storedAnswer) {
              console.log('💾 Saving scenario response:', scenario.id, 'type: email', 'answer:', storedAnswer.answer);
              await saveScenarioResponse(scenario, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
              await new Promise(resolve => setTimeout(resolve, 100));
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

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        console.log('Fetching email scenarios from:', `${apiUrl}/api/scenarios/email`);
        // Fetch ALL email scenarios (no limit)
        const response = await axios.get(`${apiUrl}/api/scenarios/email`);
        
        console.log('Received scenarios:', response.data);
        const data = response.data || [];
        
        if (!Array.isArray(data) || data.length === 0) {
          console.warn('No scenarios returned from API');
          setScenarios([]);
          setLoading(false);
          return;
        }
        
        // Parse JSON fields if they're strings
        const parsedData = data.map((scenario: any) => {
          const parsed: EmailScenario = { ...scenario };
          
          // Convert is_phishing to boolean (MySQL returns 0/1)
          const isPhishingValue = (parsed as any).is_phishing;
          if (typeof isPhishingValue === 'number') {
            parsed.is_phishing = isPhishingValue === 1;
          } else if (typeof isPhishingValue === 'string') {
            parsed.is_phishing = isPhishingValue === '1' || isPhishingValue.toLowerCase() === 'true';
          } else if (typeof isPhishingValue === 'boolean') {
            parsed.is_phishing = isPhishingValue;
          } else {
            // Default to false if unknown type
            parsed.is_phishing = false;
          }
          
          // Parse JSON fields
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
          
          return parsed;
        });
        
        setScenarios(parsedData);
        setStartTime(Date.now());
        setScenarioStartTime(Date.now());
        
        // Reset saved scenarios tracking and answers
        savedScenarioIdsRef.current.clear();
        scenarioAnswersRef.current.clear();
        
        // Start playthrough (only once - don't reset the ref here to prevent duplicates)
        // The ref will only be set to true when startPlaythrough() is actually called
        if (parsedData.length > 0 && !playthroughStartedRef.current) {
          startPlaythrough();
        }
        
        console.log('Scenarios set, count:', parsedData.length);
      } catch (error: any) {
        console.error('Error fetching email scenarios:', error);
        if (error?.response?.data) {
          console.error('Error details:', error.response.data);
        } else if (error?.message) {
          console.error('Error message:', error.message);
        }
        setScenarios([]);
      } finally {
        setLoading(false);
        console.log('Loading set to false');
      }
    };

    fetchScenarios();
  }, [apiUrl]);

  const handleAnswer = (answer: boolean) => {
    const currentData = scenarios[currentScenario];
    const correctAnswer = currentData?.is_phishing;
    
    console.log('User answer:', answer, 'Correct answer:', correctAnswer, 'Type of correct answer:', typeof correctAnswer, 'scenarioId:', currentData?.id);
    
    // Store the answer in ref so we can save it later if needed
    const answerTime = Date.now();
    if (currentData?.id) {
      scenarioAnswersRef.current.set(currentData.id, {
        answer,
        correctAnswer: correctAnswer || false,
        startTime: scenarioStartTime,
        answerTime: answerTime
      });
      console.log('Stored answer for scenario:', currentData.id, 'Total stored:', scenarioAnswersRef.current.size);
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

    const indicators = currentData.indicators?.indicators || [];
    const maxStep = indicators.length > 0 
      ? Math.max(...indicators.map((ind) => ind.show_on_step))
      : 1;

    console.log('handleNextStep - currentStep:', currentStep, 'maxStep:', maxStep, 'userAnswer:', userAnswer, 'scenarioId:', currentData.id);

    if (currentStep < maxStep) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save scenario response after going through all indicators
      // IMPORTANT: Save BEFORE calling handleNext() which resets userAnswer
      if (userAnswer !== null && currentData) {
        console.log('All indicators shown, saving response for scenario:', currentData.id, 'type: email', 'answer:', userAnswer);
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

  const handleNext = async () => {
    const currentData = scenarios[currentScenario];
    
    // Check if this scenario has indicators
    const indicators = (currentData?.indicators as any)?.indicators || [];
    
    // If there are NO indicators, save the response here BEFORE moving to next
    // (Scenarios with indicators are saved in handleNextStep when all indicators are shown)
    if (currentData && userAnswer !== null && indicators.length === 0) {
      console.log('Saving response for scenario with no indicators:', currentData.id, 'type: email', 'answer:', userAnswer);
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
        // Check which scenarios haven't been saved yet and save them using stored answers
        const unsavedScenarios = scenarios.filter(s => {
          if (!s.id) return false;
          return !savedScenarioIdsRef.current.has(s.id);
        });
        
        if (unsavedScenarios.length > 0 && playthroughId) {
          console.warn('⚠️ Found unsaved scenarios, saving them now:', unsavedScenarios.length);
          
          // Save all unsaved scenarios using stored answers
          for (const scenario of unsavedScenarios) {
            if (scenario.id) {
              const storedAnswer = scenarioAnswersRef.current.get(scenario.id);
              if (storedAnswer) {
                console.log('💾 Saving unsaved scenario:', scenario.id, 'type: email', 'answer:', storedAnswer.answer);
                await saveScenarioResponse(scenario, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
                await new Promise(resolve => setTimeout(resolve, 100));
              } else {
                console.error('❌ No stored answer for scenario:', scenario.id, 'type: email');
              }
            }
          }
        }
        
        // Ensure last scenario response is saved if it wasn't already
        if (currentData && currentData.id && playthroughId) {
          const alreadySaved = savedScenarioIdsRef.current.has(currentData.id);
          if (!alreadySaved) {
            const storedAnswer = scenarioAnswersRef.current.get(currentData.id);
            if (storedAnswer) {
              console.log('💾 Game ending - saving last scenario response:', currentData.id, 'type: email');
              await saveScenarioResponse(currentData, storedAnswer.answer, storedAnswer.correctAnswer, storedAnswer.startTime);
              await new Promise(resolve => setTimeout(resolve, 300));
            } else if (userAnswer !== null) {
              console.log('💾 Game ending - saving last scenario response (using current userAnswer):', currentData.id);
              await saveScenarioResponse(currentData, userAnswer, currentData.is_phishing || false);
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } else {
            console.log('✅ Last scenario already saved:', currentData.id);
          }
        }
        
        console.log('📊 Final save summary:', {
          totalScenarios: scenarios.length,
          totalSaved: savedScenarioIdsRef.current.size,
          savedIds: Array.from(savedScenarioIdsRef.current).sort((a, b) => a - b),
          missingIds: scenarios
            .map(s => s.id)
            .filter(id => id && !savedScenarioIdsRef.current.has(id))
            .sort((a, b) => (a || 0) - (b || 0)),
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
        
        const results = {
          type: 'email',
          totalScenarios: scenarios.length,
          correctAnswers: score,
          accuracy: Math.round((score / scenarios.length) * 100),
          totalTime: totalTime,
          scenarios: scenarios
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
      const results = {
        type: 'email',
        totalScenarios: scenarios.length,
        correctAnswers: score,
        accuracy: Math.round((score / scenarios.length) * 100),
        totalTime: totalTime,
        scenarios: scenarios
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Scenarios Available</h2>
          <p className="text-gray-600 mb-2">
            {scenarios.length === 0 
              ? 'Unable to load email scenarios. This could be due to:'
              : 'No more scenarios available.'}
          </p>
          {scenarios.length === 0 && (
            <ul className="text-left text-gray-600 mb-4 space-y-1 text-sm">
              <li>• Backend server not running (check http://localhost:5000)</li>
              <li>• Database connection issue</li>
              <li>• No email scenarios in database</li>
              <li>• Network/CORS error</li>
            </ul>
          )}
          <p className="text-xs text-gray-500 mb-4">
            API URL: {apiUrl}/api/scenarios/email
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="btn-secondary"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/game-mode')}
              className="btn-primary"
            >
              Back to Game Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  const attachments = currentData.attachments?.attachments || [];
  const currentIndicators = getIndicatorsForStep(currentData, currentStep);
  const allIndicators = currentData.indicators?.indicators || [];
  const maxStep = allIndicators.length > 0 
    ? Math.max(...allIndicators.map((ind) => ind.show_on_step))
    : 1;

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
              Email Training Mode
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
          /* Email Interface */
          <div className="card">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Phishing Detection</h2>
              <p className="text-gray-600">
                Examine this email carefully. Is it a legitimate email or a phishing attempt?
              </p>
            </div>

            {/* Logo if available */}
            {currentData.logo_url && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={currentData.logo_url} 
                  alt={currentData.title}
                  className="max-h-16 object-contain"
                />
              </div>
            )}

            {/* Email Header */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-20">From:</span>
                  <span className="text-gray-900">
                    {currentData.sender_name || currentData.sender || 'Unknown'}
                    {currentData.sender_email && (
                      <span className="text-gray-600"> &lt;{currentData.sender_email}&gt;</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 w-20">Subject:</span>
                  <span className="text-gray-900">{currentData.subject}</span>
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

            {/* Email Content */}
            <div className="bg-white border border-gray-300 rounded-lg p-6 mb-8">
              {renderEmailContent(currentData)}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleAnswer(false)}
                className="btn-success flex items-center justify-center px-8 py-3 text-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Legitimate Email
              </button>
              <button
                onClick={() => handleAnswer(true)}
                className="btn-danger flex items-center justify-center px-8 py-3 text-lg"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Phishing Email
              </button>
            </div>
          </div>
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
                {currentData.overall_explanation || currentData.explanation || 'No explanation available.'}
              </p>
              
              {currentData.learning_points && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h5 className="font-semibold text-gray-900 mb-2">Learning Points:</h5>
                  <div className="text-gray-700 whitespace-pre-wrap">{currentData.learning_points}</div>
                </div>
              )}
            </div>

            {/* Indicators for current step */}
            {currentIndicators.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Indicators (Step {currentStep} of {maxStep})
                </h4>
                <div className="space-y-4">
                  {currentIndicators.map((indicator) => {
                    const severityColor = 
                      indicator.severity === 'high' ? 'text-red-600' :
                      indicator.severity === 'medium' ? 'text-orange-600' :
                      'text-yellow-600';
                    
                    const categoryColor = 
                      indicator.category === 'suspicious' ? 'bg-red-100 border-red-300' :
                      'bg-green-100 border-green-300';

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
                        {indicator.highlight_text && (() => {
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
            )}

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              {currentStep < maxStep ? (
                <button
                  onClick={handleNextStep}
                  className="btn-primary flex items-center px-8 py-3 text-lg"
                >
                  Next Indicator
                  <ArrowRight className="h-5 w-5 ml-2" />
                </button>
              ) : (
              <button
                onClick={handleNext}
                className="btn-primary flex items-center px-8 py-3 text-lg"
              >
                {currentScenario < scenarios.length - 1 ? 'Next Scenario' : 'View Results'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailSimulation;
