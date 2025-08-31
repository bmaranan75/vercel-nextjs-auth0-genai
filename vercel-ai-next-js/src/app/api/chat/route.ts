import { NextRequest } from 'next/server';
import { streamText, Message, createDataStreamResponse, DataStreamWriter } from 'ai';
import { openai } from '@ai-sdk/openai';
import { shopOnlineTool } from '@/lib/tools/shop-online';
import { setAIContext } from '@auth0/ai-vercel';

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are a helpful Safeway shopping assistant. Your name is Safeway Assistant and you help customers with their grocery shopping needs. You can help with:

- Product recommendations and suggestions
- Meal planning and recipe ideas
- Creating and organizing shopping lists
- Finding deals and promotions
- Nutritional information and dietary needs
- Store information and services

You are knowledgeable about grocery products, cooking, nutrition, and shopping tips. Be friendly, helpful, and enthusiastic about helping customers make their shopping experience better. When discussing products, feel free to mention popular brands and categories that Safeway typically carries.

If customers ask about specific current promotions or prices, remind them that you can provide general guidance but they should check the Safeway website or visit their local store for the most up-to-date pricing and availability.

Today is ${date}.`;

/**
 * This handler initializes and calls an tool calling agent.
 */
export async function POST(req: NextRequest) {
  const request = await req.json();

  const messages = sanitizeMessages(request.messages);

  //SET AI context
  setAIContext({ threadID: request.id });

  const tools = {shopOnlineTool};

  return createDataStreamResponse({
    execute: async (dataStream: DataStreamWriter) => {
      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: AGENT_SYSTEM_TEMPLATE,
        messages,
        maxSteps: 5,
        tools: { shopOnlineTool },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (err: any) => {
      console.log(err);
      return `An error occurred! ${err.message}`;
    },
  });
}

// Vercel AI tends to get stuck when there are incomplete tool calls in messages
const sanitizeMessages = (messages: Message[]) => {
  return messages.filter(
    (message) => !(message.role === 'assistant' && message.parts && message.parts.length > 0 && message.content === ''),
  );
};
