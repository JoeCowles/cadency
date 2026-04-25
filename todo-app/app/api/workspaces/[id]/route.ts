import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { updateWorkspaceSchema } from '@/lib/validators/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const workspace = await db.query.workspaces.findFirst({
      where: eq(schema.workspaces.id, id),
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const [memberCountResult, boardCountResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.workspaceMembers)
        .where(eq(schema.workspaceMembers.workspaceId, id)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.boards)
        .where(
          and(
            eq(schema.boards.workspaceId, id),
            isNull(schema.boards.archivedAt)
          )
        ),
    ]);

    return NextResponse.json({
      ...workspace,
      member_count: Number(memberCountResult[0]?.count ?? 0),
      board_count: Number(boardCountResult[0]?.count ?? 0),
    });
  } catch (error) {
    console.error('GET /api/workspaces/[id] error:', error);
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
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [workspace] = await db
      .update(schema.workspaces)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.workspaces.id, id))
      .returning();

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('PATCH /api/workspaces/[id] error:', error);
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

    // Check if user is admin
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, id),
        eq(schema.workspaceMembers.userId, user.id!)
      ),
    });

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete workspaces' }, { status: 403 });
    }

    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workspaces/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
