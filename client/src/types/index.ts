// Type definitions for PhishHunt application

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isGuest: boolean;
  createdAt?: string;
  lastLogin?: string;
  totalPlaythroughs?: number;
  bestAccuracy?: number;
  totalCorrectAnswers?: number;
  totalQuestionsAnswered?: number;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  username: string;
}

export interface GoogleLoginPayload {
  email: string;
  firstName: string;
  lastName?: string;
  googleId: string;
  username?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  generateUsernameFromEmail: (email: string) => Promise<string>;
  loginWithGoogle: (payload: GoogleLoginPayload) => Promise<boolean>;
  guestLogin: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface EmailLink {
  id: number;
  text: string;
  url: string;
  position?: { start: number; end: number };
  hover_tip?: string;
  show_hover_tip?: boolean;
}

export interface EmailAttachment {
  id: number;
  filename: string;
  filepath: string;
  file_type: string;
  file_icon: string;
  filesize_bytes: number;
  password_protected: boolean;
  contains_macros: boolean;
  hint?: string;
}

export interface EmailIndicator {
  id: number;
  show_on_step: number;
  type: string;
  category: 'suspicious' | 'legitimate';
  severity: 'low' | 'medium' | 'high';
  highlight_target: 'full' | 'full_email' | 'partial' | 'filename';
  highlight_text: string;
  position?: { start: number; end: number } | null;
  title: string;
  explanation: string;
  recommendation?: string;
}

export interface EmailScenario {
  id: number;
  title: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  content: string;
  requires_user_input: boolean;
  template_variables?: { variables: string[] };
  is_phishing: boolean;
  logo_url?: string | null;
  links?: { links: EmailLink[] } | null;
  attachments?: { attachments: EmailAttachment[] } | null;
  indicators?: { indicators: EmailIndicator[] } | null;
  overall_explanation: string;
  learning_points: string;
  // Legacy fields for backward compatibility
  sender?: string;
  difficulty_level?: string;
  red_flags?: string;
  explanation?: string;
  image_url?: string;
}

export interface SMSLink {
  id: number;
  text: string;
  url: string;
  hover_tip?: string;
  show_hover_tip?: boolean;
}

export interface SMSIndicator {
  id: number;
  show_on_step: number;
  type: string;
  category: 'suspicious' | 'legitimate' | 'caution';
  severity: 'low' | 'medium' | 'high';
  highlight_target: 'full' | 'header' | 'partial';
  highlight_text: string;
  title: string;
  explanation: string;
  recommendation?: string;
}

export interface SMSScenario {
  id: number;
  title: string;
  sender_number: string;
  message_content: string;
  is_phishing: boolean;
  links?: { links: SMSLink[] } | null;
  indicators?: { indicators: SMSIndicator[] } | null;
  overall_explanation: string;
  learning_points: string;
  // Legacy fields for backward compatibility
  message?: string;
  difficulty_level?: string;
  red_flags?: string;
  explanation?: string;
  image_url?: string;
}

export interface WiFiIndicator {
  id: number;
  show_on_step: number;
  type: string;
  category: 'suspicious' | 'legitimate' | 'caution' | 'danger' | 'info';
  severity: 'low' | 'medium' | 'high';
  highlight_target: 'full' | 'network_name' | 'security_type' | 'signal_strength' | 'none';
  highlight_text: string;
  title: string;
  explanation: string;
  recommendation?: string;
}

export interface WiFiScenario {
  id: number;
  title: string;
  network_name: string;
  security_type: string;
  signal_strength: number;
  context_description: string;
  is_phishing: boolean;
  indicators?: { indicators: WiFiIndicator[] } | null;
  overall_explanation: string;
  learning_points: string;
  // Legacy fields for backward compatibility
  difficulty_level?: string;
  red_flags?: string;
  explanation?: string;
  image_url?: string;
}

export interface GameResults {
  type: string;
  totalScenarios: number;
  correctAnswers: number;
  accuracy: number;
  totalTime: number;
  scenarios: any[];
  mode?: 'classic' | 'mixed' | 'email' | 'sms' | 'wifi';
}

export interface PlaythroughStats {
  totalScenarios: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: number;
  averageResponseTime: number;
}

export interface UserProgress {
  scenario_type: string;
  total_attempts: number;
  correct_answers: number;
  incorrect_answers: number;
  best_accuracy: number;
  average_response_time: number;
  last_played: string;
}

export interface Playthrough {
  id: number;
  session_type: string;
  started_at: string;
  completed_at?: string;
  total_scenarios: number;
  total_correct: number;
  total_incorrect: number;
  accuracy: number;
  total_time_seconds: number;
  average_response_time: number;
  is_completed: boolean;
}


