import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    // Check if star exists
    const existing = await db.query.boardStars.findFirst({
      where: and(
        eq(schema.boardStars.boardId, id),
        eq(schema.boardStars.userId, user.id!)
      ),
    });

    if (existing) {
      // Remove star
      await db
        .delete(schema.boardStars)
        .where(
          and(
            eq(schema.boardStars.boardId, id),
            eq(schema.boardStars.userId, user.id!)
          )
        );

      return NextResponse.json({ starred: false });
    } else {
      // Add star
      await db.insert(schema.boardStars).values({
        boardId: id,
        userId: user.id!,
      });

      return NextResponse.json({ starred: true });
    }
  } catch (error) {
    console.error('POST /api/boards/[id]/star error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
