import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { setCardLabelsSchema } from '@/lib/validators/card';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = setCardLabelsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Delete all existing card labels
    await db
      .delete(schema.cardLabels)
      .where(eq(schema.cardLabels.cardId, id));

    // Insert new ones
    if (parsed.data.label_ids.length > 0) {
      await db.insert(schema.cardLabels).values(
        parsed.data.label_ids.map((labelId) => ({
          cardId: id,
          labelId,
        }))
      );
    }

    // Fetch updated labels to return
    const cardLabelsRows = await db
      .select({
        cardId: schema.cardLabels.cardId,
        labelId: schema.cardLabels.labelId,
        label: schema.labels,
      })
      .from(schema.cardLabels)
      .innerJoin(schema.labels, eq(schema.cardLabels.labelId, schema.labels.id))
      .where(eq(schema.cardLabels.cardId, id));

    const result = cardLabelsRows.map((row) => ({
      card_id: row.cardId,
      label_id: row.labelId,
      labels: row.label,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('PUT /api/cards/[id]/labels error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
