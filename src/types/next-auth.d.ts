import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      userId?: string;
    };
  }
  interface JWT {
    accessToken?: string;
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
  }
} 



