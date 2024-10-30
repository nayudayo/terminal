import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth';

const POST_PUSH_MESSAGE = `
[SIGNAL DETECTED]
FREQUENCY ANOMALY FOUND
INITIATING DIGITAL BRIDGE PROTOCOL...

>AWAITING X NETWORK SYNCHRONIZATION
>TYPE "connect x account" TO PROCEED
>WARNING: EXACT SYNTAX REQUIRED

CONNECTION STATUS: PENDING...
`;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const session = await getServerSession(authOptions);

    // Handle push command
    if (message.toLowerCase() === 'push') {
      return NextResponse.json({
        message: POST_PUSH_MESSAGE
      });
    }

    // Handle Twitter connection command
    if (message.toLowerCase() === 'connect x account') {
      if (session) {
        return NextResponse.json({
          message: 'X account already connected as ' + session.user.name
        });
      } else {
        return NextResponse.json({
          message: '[INITIATING X NETWORK SYNC]\nRedirecting to authorization...',
          action: 'CONNECT_TWITTER'
        });
      }
    }

    // Handle other messages
    const response = {
      message: `Echo: ${message}`,
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
