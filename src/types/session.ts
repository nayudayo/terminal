export enum SessionStage {
    INTRO_MESSAGE = 0,
    POST_PUSH_MESSAGE = 1,
    CONNECT_TWITTER = 2,
    AUTHENTICATED = 3,
    MANDATES = 4,
    TELEGRAM_REDIRECT = 5,
    TELEGRAM_CODE = 6,
    WALLET_SUBMIT = 7,
    REFERENCE_CODE = 8,
    PROTOCOL_COMPLETE = 9,
  }
  
  export interface UserSession {
    userId: string;
    stage: SessionStage;
    twitterId?: string;
    accessToken?: string;
    timestamp: number;
  } 