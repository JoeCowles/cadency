import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createLabelSchema = z.object({
  text: z.string().min(1).max(50),
  color: z.enum(['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'pink']),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const labels = await db
      .select()
      .from(schema.labels)
      .where(eq(schema.labels.workspaceId, id));

    return NextResponse.json({ labels });
  } catch (error) {
    console.error('GET /api/workspaces/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [label] = await db
      .insert(schema.labels)
      .values({
        workspaceId: id,
        text: parsed.data.text,
        color: parsed.data.color,
      })
      .returning();

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
