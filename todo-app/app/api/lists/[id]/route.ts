import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateListSchema } from '@/lib/validators/board';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = updateListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [list] = await db
      .update(schema.lists)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.lists.id, id))
      .returning();

    return NextResponse.json(list);
  } catch (error) {
    console.error('PATCH /api/lists/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const [list] = await db
      .update(schema.lists)
      .set({ archivedAt: new Date() })
      .where(eq(schema.lists.id, id))
      .returning();

    return NextResponse.json(list);
  } catch (error) {
    console.error('DELETE /api/lists/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
