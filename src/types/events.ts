export interface ChatCommandEvent extends CustomEvent {
  detail: 'CONNECT_TWITTER' | string;
}

export interface ChatResponse {
  message: string;
  dispatchEvent?: string;
  success?: boolean;
  error?: string;
} 