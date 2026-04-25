import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';
import { createListSchema } from '@/lib/validators/board';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createListSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    let position = parsed.data.position;

    if (position === undefined) {
      // Get max position in board
      const result = await db
        .select({ maxPos: sql<number>`coalesce(max(${schema.lists.position}), -1)` })
        .from(schema.lists)
        .where(
          and(
            eq(schema.lists.boardId, id),
            isNull(schema.lists.archivedAt)
          )
        );

      position = Number(result[0]?.maxPos ?? -1) + 1;
    }

    const [list] = await db
      .insert(schema.lists)
      .values({
        boardId: id,
        name: parsed.data.name,
        position,
      })
      .returning();

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('POST /api/boards/[id]/lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
