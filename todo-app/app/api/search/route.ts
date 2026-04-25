import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { ilike, eq, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const q = request.nextUrl.searchParams.get('q') || '';
    if (!q.trim()) {
      return NextResponse.json({ boards: [], cards: [], workspaces: [] });
    }

    const pattern = `%${q}%`;

    // Get user's workspace IDs
    const memberships = await db
      .select({ workspaceId: schema.workspaceMembers.workspaceId })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, user.id!));

    const wsIds = memberships.map(m => m.workspaceId);
    if (wsIds.length === 0) {
      return NextResponse.json({ boards: [], cards: [], workspaces: [] });
    }

    // Search workspaces
    const workspaces = await db
      .select()
      .from(schema.workspaces)
      .where(inArray(schema.workspaces.id, wsIds))
      .then(rows => rows.filter(w => w.name.toLowerCase().includes(q.toLowerCase())));

    // Search boards
    const boards = await db
      .select()
      .from(schema.boards)
      .where(inArray(schema.boards.workspaceId, wsIds))
      .then(rows => rows.filter(b => b.name.toLowerCase().includes(q.toLowerCase())).slice(0, 10));

    // Search cards
    const boardIds = await db
      .select({ id: schema.boards.id })
      .from(schema.boards)
      .where(inArray(schema.boards.workspaceId, wsIds))
      .then(rows => rows.map(r => r.id));

    let cards: any[] = [];
    if (boardIds.length > 0) {
      const listIds = await db
        .select({ id: schema.lists.id })
        .from(schema.lists)
        .where(inArray(schema.lists.boardId, boardIds))
        .then(rows => rows.map(r => r.id));

      if (listIds.length > 0) {
        cards = await db
          .select()
          .from(schema.cards)
          .where(inArray(schema.cards.listId, listIds))
          .then(rows => rows.filter(c => c.title.toLowerCase().includes(q.toLowerCase())).slice(0, 10));
      }
    }

    return NextResponse.json({ boards, cards, workspaces });
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
