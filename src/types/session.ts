export enum SessionStage {
    INTRO_MESSAGE = 1,
    POST_PUSH_MESSAGE = 2,
    CONNECT_TWITTER = 3,
    AUTHENTICATED = 4,
    MANDATES = 5,
    TELEGRAM_REDIRECT = 6,
    TELEGRAM_CODE = 7,
    WALLET_SUBMIT = 8,
    REFERENCE_CODE = 9,
    PROTOCOL_COMPLETE = 10,
  }
  
  export interface UserSession {
    userId: string;
    stage: SessionStage;
    twitterId?: string;
    accessToken?: string;
    timestamp: number;
  } 