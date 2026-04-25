import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { createCardSchema } from '@/lib/validators/card';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    let position = parsed.data.position;

    if (position === undefined) {
      const result = await db
        .select({ maxPos: sql<number>`coalesce(max(${schema.cards.position}), -1)` })
        .from(schema.cards)
        .where(
          and(
            eq(schema.cards.listId, id),
            isNull(schema.cards.archivedAt)
          )
        );

      position = Number(result[0]?.maxPos ?? -1) + 1;
    }

    const [card] = await db
      .insert(schema.cards)
      .values({
        listId: id,
        title: parsed.data.title,
        position,
        createdBy: user.id!,
      })
      .returning();

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('POST /api/lists/[id]/cards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
