import { SessionStage } from '../types/session';

export function logStageTransition(
  userId: string, 
  action: string, 
  stage: SessionStage
): Promise<void>; 