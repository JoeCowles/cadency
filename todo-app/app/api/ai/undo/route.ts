import { NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { executeUndo, type UndoOperation } from '@/lib/ai-tools';

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return unauthorized();

  const { undoOps } = await request.json();
  const baseUrl = request.nextUrl.origin;
  const cookie = request.headers.get('cookie') || '';

  const results: boolean[] = [];
  for (const op of (undoOps as UndoOperation[]).reverse()) {
    const ok = await executeUndo(op, baseUrl, cookie, user.id!);
    results.push(ok);
  }

  return Response.json({ success: results.every(Boolean), results });
}
