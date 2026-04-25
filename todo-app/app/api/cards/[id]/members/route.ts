import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setCardMembersSchema } from '@/lib/validators/card';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = setCardMembersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Delete all existing card members
    await db
      .delete(schema.cardMembers)
      .where(eq(schema.cardMembers.cardId, id));

    // Insert new ones
    if (parsed.data.user_ids.length > 0) {
      await db.insert(schema.cardMembers).values(
        parsed.data.user_ids.map((userId) => ({
          cardId: id,
          userId,
        }))
      );
    }

    // Fetch updated members to return
    const cardMembersRows = await db
      .select({
        cardId: schema.cardMembers.cardId,
        userId: schema.cardMembers.userId,
        user: {
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          hue: schema.users.hue,
        },
      })
      .from(schema.cardMembers)
      .innerJoin(schema.users, eq(schema.cardMembers.userId, schema.users.id))
      .where(eq(schema.cardMembers.cardId, id));

    const result = cardMembersRows.map((row) => ({
      card_id: row.cardId,
      user_id: row.userId,
      profiles: row.user,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/cards/[id]/members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
