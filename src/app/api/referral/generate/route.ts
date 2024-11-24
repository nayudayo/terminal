import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/auth';
import { generateReferralCode, getReferralCode } from '@/lib/referralSystem';
import { SessionManager } from '@/lib/sessionManager';
import { SessionStage } from '@/types/session';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/messages'; 

export async function POST(request: Request) {
 try {
   // Verify session first
   const session = await getServerSession(authOptions);
   if (!session?.user) {
     return NextResponse.json(
       { error: ERROR_MESSAGES.SESSION_REQUIRED }, 
       { status: 401 }
     );
   }
    const { userId, userName } = await request.json();
   
   // Validate input
   if (!userId || userId !== session.user.id) {
     return NextResponse.json(
       { error: ERROR_MESSAGES.SESSION_REQUIRED }, 
       { status: 400 }
     );
   }
    // Verify user stage
   const currentSession = await SessionManager.getSession(userId);
   if (!currentSession || currentSession.stage < SessionStage.REFERENCE_CODE) {
     return NextResponse.json(
       { error: ERROR_MESSAGES.PREVIOUS_STEPS },
       { status: 400 }
     );
   }
    // Check for existing code first
   const existingCode = await getReferralCode(userId);
   if (existingCode) {
     await SessionManager.updateSessionStage(userId, SessionStage.PROTOCOL_COMPLETE);
     
     return NextResponse.json({
       code: existingCode,
       message: SUCCESS_MESSAGES.REFERENCE_CODE_EXISTS(existingCode),
       newStage: SessionStage.PROTOCOL_COMPLETE,
       isExisting: true
     });
   }
    // Generate new code
   const code = await generateReferralCode(userId, userName || 'USER');
   await SessionManager.updateSessionStage(userId, SessionStage.PROTOCOL_COMPLETE);
    return NextResponse.json({
     code,
     message: SUCCESS_MESSAGES.REFERENCE_CODE_GENERATED(code),
     newStage: SessionStage.PROTOCOL_COMPLETE,
     isExisting: false
   });
  } catch (error) {
   console.error('Error in referral code generation:', error);
   return NextResponse.json(
     { error: ERROR_MESSAGES.REFERENCE_FAILED },
     { status: 500 }
   );
 }
}