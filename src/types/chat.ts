import { INTRO_MESSAGE, POST_PUSH_MESSAGE } from '@/constants/messages';

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
  timestamp: number;
}

export interface CompletionStatus {
  mandatesComplete: boolean;
  followComplete: boolean;
  likeComplete: boolean;
  telegramComplete: boolean;
  verificationComplete: boolean;
  walletComplete: boolean;
  referenceComplete: boolean;
  currentStep: number;
  lastUpdated: number;
}

export interface ChatResponse {
  message: string;
  action?: 'CONNECT_TWITTER';
  commandComplete?: boolean;
  shouldAutoScroll?: boolean;
} 