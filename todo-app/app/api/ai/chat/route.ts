import { NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import Anthropic from '@anthropic-ai/sdk';
import { AI_TOOLS, getSystemPrompt, executeTool } from '@/lib/ai-tools';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const { messages, context, dangerousMode } = body;

  // Read the encrypted API key from the user's profile
  const profile = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id!),
  });
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const encryptedKey = prefs.encryptedApiKey as string | undefined;

  if (!encryptedKey) {
    return Response.json(
      { error: 'No API key configured. Go to Account Settings to add your Claude API key.' },
      { status: 400 },
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(encryptedKey);
  } catch {
    return Response.json(
      { error: 'Failed to decrypt API key. Please re-enter your key in Account Settings.' },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });
  const systemPrompt = getSystemPrompt(context || {}, dangerousMode || false);
  const baseUrl = request.nextUrl.origin;
  const cookie = request.headers.get('cookie') || '';

  const tools: Anthropic.Tool[] = AI_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  // Convert frontend messages to Claude format
  const claudeMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        let currentMessages = [...claudeMessages];
        let loopCount = 0;
        const maxLoops = 20;
        const allUndoOps: unknown[] = [];

        while (loopCount < maxLoops) {
          loopCount++;

          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools,
          });

          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type === 'text') {
              send({ type: 'text', content: block.text });
            } else if (block.type === 'tool_use') {
              hasToolUse = true;
              send({ type: 'tool_call', id: block.id, name: block.name, input: block.input });

              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>,
                baseUrl,
                cookie,
                context || {},
                user.id!,
              );

              if (result.undoOp) allUndoOps.push(result.undoOp);

              send({ type: 'tool_result', id: block.id, output: result.output });

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: result.output,
              });
            }
          }

          if (!hasToolUse || response.stop_reason === 'end_turn') break;

          // Continue the agentic loop
          currentMessages.push({ role: 'assistant', content: response.content });
          currentMessages.push({ role: 'user', content: toolResults });
        }

        send({ type: 'done', undoOps: allUndoOps });
        controller.close();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'AI request failed';
        send({ type: 'error', message: msg });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
