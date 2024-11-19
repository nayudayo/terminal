import { AIResponse, ChatResponse } from '@/types/chat';
import { SessionStage } from '@/types/session';
import { STAGE_PROMPTS, DEFAULT_PROMPT } from '@/constants/prompts';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get prompt based on stage
const getPromptForStage = (stage: SessionStage) => {
  const stagePrompt = STAGE_PROMPTS[stage];
  if (!stagePrompt) {
    return DEFAULT_PROMPT;
  }
  return stagePrompt;
};

export async function generateResponse(prompt: string, stage: SessionStage = SessionStage.PROTOCOL_COMPLETE): Promise<string> {
  try {
    const { context, example_responses } = getPromptForStage(stage);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `${context}\n\nExample responses:\n${example_responses.join('\n')}\n\n
Format guidelines:
- Break long sentences into multiple lines
- Keep each line under 50 characters
- Maintain the mysterious tone
- Be concise and clear
- Use single line breaks between sentences
- No headers or separators needed`
      }, {
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });

    const response = completion.choices[0]?.message?.content || 'ERROR: NO RESPONSE GENERATED';
    
    // Format the response with single line breaks
    const formattedResponse = response
      .split('\n')
      .map(line => {
        // Break long lines at natural points (around 50 chars)
        if (line.length > 60) {
          const words = line.split(' ');
          let currentLine = '';
          const result = [];
          
          words.forEach(word => {
            if ((currentLine + word).length > 60) {
              result.push(currentLine.trim());
              currentLine = word + ' ';
            } else {
              currentLine += word + ' ';
            }
          });
          
          if (currentLine) {
            result.push(currentLine.trim());
          }
          
          return result.join('\n');
        }
        return line;
      })
      .join('\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return formattedResponse;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'ERROR: AI SUBSYSTEM MALFUNCTION\nPLEASE TRY AGAIN LATER';
  }
}

// Helper function to handle AI chat with proper typing
export async function handleAIChat(message: string, stage: SessionStage): Promise<AIResponse> {
  try {
    const aiResponse = await generateResponse(message, stage);
    
    return {
      message: aiResponse,
      shouldAutoScroll: true
    };
  } catch (error) {
    console.error('AI chat error:', error);
    return {
      message: `[SYSTEM ERROR]
=============================
ERROR: AI SUBSYSTEM MALFUNCTION
PLEASE TRY AGAIN LATER

>RETRY COMMAND...`,
      error: error instanceof Error ? error.message : 'Unknown error',
      shouldAutoScroll: true
    };
  }
}

export function isValidStage(stage: number): boolean {
  return Object.values(SessionStage).includes(stage);
}

// Helper function to check if message is a command
export function isCommand(message: string): boolean {
  const exactCommands = [
    'help',
    'mandates',
    'skip mandates',
    'follow ptb',
    'like ptb',
    'telegram',
    'skip telegram',
    'verify',
    'skip verify',
    'wallet',
    'skip wallet',
    'reference',
    'skip reference',
    'generate code',
    'show referral code'
  ];
  
  // Convert message to lowercase for comparison
  const lowerMessage = message.toLowerCase();
  
  // Check exact matches first
  if (exactCommands.includes(lowerMessage)) {
    return true;
  }
  
  // Check prefix matches
  const prefixCommands = [
    'submit code ',
    'wallet ',
    'verify '
  ];
  
  // Check if message starts with any of the prefix commands
  return prefixCommands.some(cmd => lowerMessage.startsWith(cmd));
}