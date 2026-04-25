import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateLabelSchema = z.object({
  text: z.string().min(1).max(50).optional(),
  color: z.enum(['green', 'yellow', 'orange', 'red', 'purple', 'blue', 'pink']).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [label] = await db
      .update(schema.labels)
      .set(parsed.data)
      .where(eq(schema.labels.id, id))
      .returning();

    return NextResponse.json({ label });
  } catch (error) {
    console.error('PATCH /api/labels/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    await db.delete(schema.labels).where(eq(schema.labels.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/labels/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
