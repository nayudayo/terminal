import { INTRO_MESSAGE, POST_PUSH_MESSAGE } from '@/constants/messages';
import { SessionStage } from '@/types/session';

export interface Message {
  id: string;
  content: string | typeof INTRO_MESSAGE | typeof POST_PUSH_MESSAGE;
  role: 'user' | 'assistant';
  timestamp: number;
  isIntro?: boolean;
  showButton?: boolean;
  isAuthenticated?: boolean;
}

export interface ChatState {
  messages: Message[];
  completionStatus: CompletionStatus;
  sessionStage: SessionStage;
  timestamp: number;
  lastResponse?: string;
}

export interface CompletionStatus {
  pushComplete?: boolean;
  pushDownComplete?: boolean;
  followComplete?: boolean;
  likeComplete?: boolean;
  mandatesComplete?: boolean;
  telegramComplete?: boolean;
  verificationComplete?: boolean;
  walletComplete?: boolean;
  referenceComplete?: boolean;
  currentStep: number;
  lastUpdated: number;
}

export interface ChatResponse {
  message: string;
  action?: 'INTRO_MESSAGE' | 'CONNECT_TWITTER' | 'SHOW_MANDATES' | 'SHOW_TELEGRAM' | 
          'SHOW_VERIFICATION' | 'SHOW_WALLET' | 'SHOW_REFERENCE';
  commandComplete?: boolean;
  shouldAutoScroll?: boolean;
  dispatchEvent?: string;
  newStage?: SessionStage;
  followComplete?: boolean;
  likeComplete?: boolean;
  telegramComplete?: boolean;
  verificationComplete?: boolean;
  walletComplete?: boolean;
  referenceComplete?: boolean;
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIResponse {
  message: string;
  shouldAutoScroll?: boolean;
  error?: string;
}