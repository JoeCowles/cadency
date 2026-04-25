import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { updateCardSchema } from '@/lib/validators/card';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    // Fetch card
    const card = await db.query.cards.findFirst({
      where: eq(schema.cards.id, id),
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Fetch the list name for display
    const list = await db.query.lists.findFirst({ where: eq(schema.lists.id, card.listId) });

    // Fetch all related data in parallel
    const [checklistItems, commentsRows, attachmentsList, activityRows, cardLabelsRows, cardMembersRows] =
      await Promise.all([
        db
          .select()
          .from(schema.checklistItems)
          .where(eq(schema.checklistItems.cardId, id))
          .orderBy(asc(schema.checklistItems.position)),
        db
          .select({
            comment: schema.comments,
            author: {
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
              hue: schema.users.hue,
            },
          })
          .from(schema.comments)
          .innerJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
          .where(eq(schema.comments.cardId, id))
          .orderBy(asc(schema.comments.createdAt)),
        db
          .select()
          .from(schema.attachments)
          .where(eq(schema.attachments.cardId, id))
          .orderBy(desc(schema.attachments.createdAt)),
        db
          .select({
            activity: schema.activity,
            user: {
              id: schema.users.id,
              name: schema.users.name,
              email: schema.users.email,
              hue: schema.users.hue,
            },
          })
          .from(schema.activity)
          .innerJoin(schema.users, eq(schema.activity.userId, schema.users.id))
          .where(eq(schema.activity.cardId, id))
          .orderBy(desc(schema.activity.createdAt)),
        db
          .select({
            cardId: schema.cardLabels.cardId,
            labelId: schema.cardLabels.labelId,
            label: schema.labels,
          })
          .from(schema.cardLabels)
          .innerJoin(schema.labels, eq(schema.cardLabels.labelId, schema.labels.id))
          .where(eq(schema.cardLabels.cardId, id)),
        db
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
          .where(eq(schema.cardMembers.cardId, id)),
      ]);

    // Format comments to include nested profiles
    const comments = commentsRows.map((row) => ({
      ...row.comment,
      profiles: row.author,
    }));

    // Format activity to include nested profiles
    const activityList = activityRows.map((row) => ({
      ...row.activity,
      profiles: row.user,
    }));

    // Format card_labels
    const cardLabels = cardLabelsRows.map((row) => ({
      card_id: row.cardId,
      label_id: row.labelId,
      labels: row.label,
    }));

    // Format card_members
    const cardMembers = cardMembersRows.map((row) => ({
      card_id: row.cardId,
      user_id: row.userId,
      profiles: row.user,
    }));

    return NextResponse.json({
      ...card,
      listName: list?.name ?? null,
      checklist_items: checklistItems,
      comments,
      attachments: attachmentsList,
      activity: activityList,
      card_labels: cardLabels,
      card_members: cardMembers,
    });
  } catch (error) {
    console.error('GET /api/cards/[id] error:', error);
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
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Map snake_case validator fields to camelCase schema fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.cover !== undefined) updateData.cover = parsed.data.cover;
    if (parsed.data.due_date !== undefined) {
      updateData.dueDate = parsed.data.due_date ? new Date(parsed.data.due_date) : null;
    }
    if (parsed.data.start_time !== undefined) updateData.startTime = parsed.data.start_time;
    if (parsed.data.end_time !== undefined) updateData.endTime = parsed.data.end_time;

    const [card] = await db
      .update(schema.cards)
      .set(updateData)
      .where(eq(schema.cards.id, id))
      .returning();

    return NextResponse.json(card);
  } catch (error) {
    console.error('PATCH /api/cards/[id] error:', error);
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

    const [card] = await db
      .update(schema.cards)
      .set({ archivedAt: new Date() })
      .where(eq(schema.cards.id, id))
      .returning();

    return NextResponse.json(card);
  } catch (error) {
    console.error('DELETE /api/cards/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
