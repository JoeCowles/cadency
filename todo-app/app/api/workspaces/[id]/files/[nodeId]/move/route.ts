import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { moveFsNodeSchema } from '@/lib/validators/files';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id, nodeId } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, id),
        eq(schema.workspaceMembers.userId, user.id!)
      ),
    });
    if (!membership) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = moveFsNodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { parentId } = parsed.data;

    const node = await db.query.fsNodes.findFirst({
      where: and(
        eq(schema.fsNodes.id, nodeId),
        eq(schema.fsNodes.workspaceId, id)
      ),
    });
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Verify target parent exists and belongs to workspace
    if (parentId) {
      const parent = await db.query.fsNodes.findFirst({
        where: and(
          eq(schema.fsNodes.id, parentId),
          eq(schema.fsNodes.workspaceId, id),
          eq(schema.fsNodes.type, 'folder')
        ),
      });
      if (!parent) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }

      // Cycle detection: walk up from target parent to root, ensure we don't hit nodeId
      let current: string | null = parentId;
      while (current) {
        if (current === nodeId) {
          return NextResponse.json({ error: 'Cannot move folder into its own descendant' }, { status: 400 });
        }
        const ancestor: { parentId: string | null } | undefined = await db.query.fsNodes.findFirst({
          where: eq(schema.fsNodes.id, current),
        });
        current = ancestor?.parentId ?? null;
      }
    }

    const [updated] = await db
      .update(schema.fsNodes)
      .set({ parentId: parentId, updatedAt: new Date() })
      .where(eq(schema.fsNodes.id, nodeId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/workspaces/[id]/files/[nodeId]/move error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
