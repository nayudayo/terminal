import { SessionStage } from '../types/session';

export async function logStageTransition(
  userId: string, 
  fromStage: SessionStage | string, 
  toStage: SessionStage
): Promise<void> {
  console.log(`[Stage Transition] User: ${userId} | Action: ${fromStage} | Stage: ${SessionStage[toStage]}`);
  
  // You could also add persistent logging here
  // await db.prepare('INSERT INTO session_logs ...').run();
} 