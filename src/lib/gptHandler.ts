import OpenAI from 'openai';
import { STAGE_PROMPTS, DEFAULT_PROMPT } from '@/constants/prompts';
import { SessionStage } from '@/types/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatResponse(response: string): string {
  return `
${response.trim()}`;
}

export async function generateResponse(
  message: string,
  stage: SessionStage,
  previousMessages: { role: 'user' | 'assistant', content: string }[] = []
): Promise<string> {
  try {
    const stagePrompt = STAGE_PROMPTS[stage] || DEFAULT_PROMPT;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using GPT-4 for better responses
      messages: [
        {
          role: "system",
          content: `${stagePrompt.context}\n\nFormat your response to be cryptic and mysterious, using capital letters and maintaining the ancient terminal aesthetic. Keep responses between 3-5 lines.`
        },
        ...previousMessages.slice(-3), // Keep last 3 messages for context
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      presence_penalty: 0.5,
      frequency_penalty: 0.5,
    });

    const content = completion.choices[0]?.message?.content || "THE ANCIENT SYSTEMS ARE SILENT...";
    
    // Format response to match terminal aesthetic
    const formattedContent = content
      .toUpperCase()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');

    return formatResponse(formattedContent);

  } catch (error) {
    console.error('GPT Response Generation Error:', error);
    return formatResponse("THE PROTOCOL ENCOUNTERS INTERFERENCE...\nPLEASE TRY AGAIN");
  }
}

// Add helper function to validate stage
export function isValidStage(stage: number): boolean {
  return Object.values(SessionStage).includes(stage);
}