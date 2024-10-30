declare namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    TWITTER_CLIENT_ID: string;
    TWITTER_CLIENT_SECRET: string;
    TWITTER_CONSUMER_KEY: string;
    TWITTER_CONSUMER_SECRET: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
  }
} 