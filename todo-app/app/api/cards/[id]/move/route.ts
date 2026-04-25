import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { moveCardSchema } from '@/lib/validators/card';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = moveCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      listId: parsed.data.listId,
    };

    if (parsed.data.position !== undefined) {
      updateData.position = parsed.data.position;
    }

    const [card] = await db
      .update(schema.cards)
      .set(updateData)
      .where(eq(schema.cards.id, id))
      .returning();

    return NextResponse.json(card);
  } catch (error) {
    console.error('PUT /api/cards/[id]/move error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
