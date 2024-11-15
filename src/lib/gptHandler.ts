import OpenAI from 'openai';
import { STAGE_PROMPTS, DEFAULT_PROMPT } from '@/constants/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type SessionStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

function formatResponse(response: string): string {
  return `[MESSENGER]
=============================
${response.split('\n').map(line => line.trim()).join('\n')}`;
}

export async function generateResponse(
  message: string,
  stage: SessionStage,
  previousMessages: { role: 'user' | 'assistant', content: string }[] = []
): Promise<string> {
  try {
    const stagePrompt = STAGE_PROMPTS[stage as keyof typeof STAGE_PROMPTS] || DEFAULT_PROMPT;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${stagePrompt.context}\n\nFormat your response to be concise and fit within 50-60 characters per line. Break longer sentences into multiple lines.`
        },
        ...previousMessages,
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });

    const content = response.choices[0].message?.content || "The ancient systems are silent...";
    return formatResponse(content);
  } catch (error) {
    console.error('GPT Response Generation Error:', error);
    return formatResponse("The protocol encounters interference... Please try again.");
  }
}