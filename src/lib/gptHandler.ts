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
  // Check if it's a command first
  if (isCommand(prompt)) {
    console.log('[Command Intercepted] Skipping AI response for:', prompt);
    return 'Command processing...';
  }

  try {
    const { context, example_responses } = getPromptForStage(stage);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: `${context}\n\nExample responses:\n${example_responses.join('\n')}\n\n
Format guidelines:
- Break long sentences into multiple lines (max 40-50 characters per line)
- Use single line breaks between sentences
- Maintain cryptic/mysterious tone
- Be concise and clear
- No headers or separators needed
- Start each new thought on a new line`
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
    
    // Format the response with proper line breaks
    const formattedResponse = response
      .split('\n')
      .map(line => {
        // Break long lines at natural points (around 40-50 chars)
        if (line.length > 60) {
          const words = line.split(' ');
          let currentLine = '';
          const result = [];
          
          words.forEach(word => {
            if ((currentLine + word).length > 45) { // Reduced to 45 for better readability
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

    // Add proper spacing between thoughts
    const finalResponse = formattedResponse
      .replace(/([.!?])\s+/g, '$1\n') // Add double line break after sentences
      .replace(/\n{3,}/g, '\n\n'); // Remove excess line breaks

    return finalResponse;
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

// Update the command checking to be more strict and prioritized
export function isCommand(message: string): boolean {
  // Normalize message for comparison
  const normalizedMessage = message.toLowerCase().trim();

  // Exact match commands (prioritized)
  const exactCommands = [
    'push',
    'connect x account',
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

  // Check exact matches first
  if (exactCommands.includes(normalizedMessage)) {
    console.log('[Command Detected] Exact match:', normalizedMessage);
    return true;
  }

  // Prefix-based commands that need additional validation
  const prefixCommands = [
    { prefix: 'submit code', minLength: 12 }, // submit code + space + actual code
    { prefix: 'wallet', minLength: 10 },      // wallet + space + addresses
    { prefix: 'verify', minLength: 7 }        // verify + space + code
  ];

  // Check prefix commands
  for (const { prefix, minLength } of prefixCommands) {
    if (normalizedMessage.startsWith(prefix) && normalizedMessage.length >= minLength) {
      console.log('[Command Detected] Prefix match:', prefix);
      return true;
    }
  }

  console.log('[Command Check] No command match for:', normalizedMessage);
  return false;
}