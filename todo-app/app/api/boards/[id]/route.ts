import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, asc, isNull, inArray } from 'drizzle-orm';
import { updateBoardSchema } from '@/lib/validators/board';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    // Fetch board
    const board = await db.query.boards.findFirst({
      where: eq(schema.boards.id, id),
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Fetch lists ordered by position, excluding archived
    const lists = await db
      .select()
      .from(schema.lists)
      .where(and(eq(schema.lists.boardId, id), isNull(schema.lists.archivedAt)))
      .orderBy(asc(schema.lists.position));

    const listIds = lists.map((l) => l.id);

    let cards: (typeof schema.cards.$inferSelect)[] = [];
    let cardLabelsMap = new Map<string, any[]>();
    let cardMembersMap = new Map<string, any[]>();

    if (listIds.length > 0) {
      // Fetch cards for all lists
      cards = await db
        .select()
        .from(schema.cards)
        .where(
          and(
            inArray(schema.cards.listId, listIds),
            isNull(schema.cards.archivedAt)
          )
        )
        .orderBy(asc(schema.cards.position));

      const cardIds = cards.map((c) => c.id);

      if (cardIds.length > 0) {
        // Fetch card_labels with labels
        const clRows = await db
          .select({
            cardId: schema.cardLabels.cardId,
            labelId: schema.cardLabels.labelId,
            label: schema.labels,
          })
          .from(schema.cardLabels)
          .innerJoin(schema.labels, eq(schema.cardLabels.labelId, schema.labels.id))
          .where(inArray(schema.cardLabels.cardId, cardIds));

        for (const row of clRows) {
          const existing = cardLabelsMap.get(row.cardId) ?? [];
          existing.push({ label: row.label });
          cardLabelsMap.set(row.cardId, existing);
        }

        // Fetch card_members with users
        const cmRows = await db
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
          .where(inArray(schema.cardMembers.cardId, cardIds));

        for (const row of cmRows) {
          const existing = cardMembersMap.get(row.cardId) ?? [];
          existing.push({ user: row.user });
          cardMembersMap.set(row.cardId, existing);
        }
      }
    }

    // Group cards by list
    const cardsByList = new Map<string, any[]>();
    for (const card of cards) {
      const listCards = cardsByList.get(card.listId) ?? [];
      listCards.push({
        ...card,
        cardLabels: cardLabelsMap.get(card.id) ?? [],
        cardMembers: cardMembersMap.get(card.id) ?? [],
      });
      cardsByList.set(card.listId, listCards);
    }

    const listsWithCards = lists.map((list) => ({
      ...list,
      cards: cardsByList.get(list.id) ?? [],
    }));

    return NextResponse.json({
      ...board,
      lists: listsWithCards,
    });
  } catch (error) {
    console.error('GET /api/boards/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = updateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [board] = await db
      .update(schema.boards)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.boards.id, id))
      .returning();

    return NextResponse.json(board);
  } catch (error) {
    console.error('PATCH /api/boards/[id] error:', error);
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

    const [board] = await db
      .update(schema.boards)
      .set({ archivedAt: new Date() })
      .where(eq(schema.boards.id, id))
      .returning();

    return NextResponse.json(board);
  } catch (error) {
    console.error('DELETE /api/boards/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
