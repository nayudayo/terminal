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
  sessionStage?: SessionStage;
  timestamp: number;
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
  action?: 'CONNECT_TWITTER';
  commandComplete?: boolean;
  shouldAutoScroll?: boolean;
  dispatchEvent?: string;
} 