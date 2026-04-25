import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, isNull, isNotNull, sql } from 'drizzle-orm';
import { createBoardSchema } from '@/lib/validators/board';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') ?? 'all';

    // Build the archived condition based on filter
    const archivedCondition =
      filter === 'archived'
        ? isNotNull(schema.boards.archivedAt)
        : isNull(schema.boards.archivedAt);

    // Fetch boards with left join on board_stars for current user
    const rows = await db
      .select({
        board: schema.boards,
        starredAt: schema.boardStars.starredAt,
      })
      .from(schema.boards)
      .leftJoin(
        schema.boardStars,
        and(
          eq(schema.boardStars.boardId, schema.boards.id),
          eq(schema.boardStars.userId, user.id!)
        )
      )
      .where(
        and(
          eq(schema.boards.workspaceId, id),
          archivedCondition
        )
      );

    const enriched = rows.map((row) => ({
      ...row.board,
      starred: row.starredAt !== null,
    }));

    if (filter === 'starred') {
      return NextResponse.json({ boards: enriched.filter((b) => b.starred) });
    }

    return NextResponse.json({ boards: enriched });
  } catch (error) {
    console.error('GET /api/workspaces/[id]/boards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createBoardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [board] = await db
      .insert(schema.boards)
      .values({
        workspaceId: id,
        name: parsed.data.name,
        description: parsed.data.description,
        gradient: parsed.data.gradient,
        scope: parsed.data.scope,
        createdBy: user.id!,
      })
      .returning();

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/boards error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
