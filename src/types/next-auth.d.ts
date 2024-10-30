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

  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
  }
} 