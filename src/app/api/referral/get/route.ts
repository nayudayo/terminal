import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { getReferralCode } from '@/lib/referralSystem';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages';
export async function POST(request: Request) {
 try {
   const session = await getServerSession(authOptions);
   if (!session?.user) {
     return NextResponse.json(
       { error: ERROR_MESSAGES.SESSION_REQUIRED }, 
       { status: 401 }
     );
   }
    const { userId } = await request.json();
   
   if (!userId || userId !== session.user.id) {
     return NextResponse.json(
       { error: ERROR_MESSAGES.SESSION_REQUIRED }, 
       { status: 400 }
     );
   }
    const code = await getReferralCode(userId);
   if (!code) {
     return NextResponse.json({
       message: ERROR_MESSAGES.REFERENCE_FAILED,
       code: null
     });
   }
    return NextResponse.json({
     code,
     message: SUCCESS_MESSAGES.REFERENCE_CODE_EXISTS(code)
   });
  } catch (error) {
   console.error('Error retrieving referral code:', error);
   return NextResponse.json(
     { error: ERROR_MESSAGES.REFERENCE_FAILED },
     { status: 500 }
   );
  }
}