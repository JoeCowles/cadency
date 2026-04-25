import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { renameFsNodeSchema } from '@/lib/validators/files';
import { unlink } from 'fs/promises';
import path from 'path';

export async function PATCH(
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
    const parsed = renameFsNodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const node = await db.query.fsNodes.findFirst({
      where: and(
        eq(schema.fsNodes.id, nodeId),
        eq(schema.fsNodes.workspaceId, id)
      ),
    });
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const [updated] = await db
      .update(schema.fsNodes)
      .set({ name: parsed.data.name, updatedAt: new Date() })
      .where(eq(schema.fsNodes.id, nodeId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/workspaces/[id]/files/[nodeId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function collectDescendants(nodeId: string): Promise<typeof schema.fsNodes.$inferSelect[]> {
  const children = await db
    .select()
    .from(schema.fsNodes)
    .where(eq(schema.fsNodes.parentId, nodeId));

  const all: typeof schema.fsNodes.$inferSelect[] = [...children];
  for (const child of children) {
    if (child.type === 'folder') {
      const descendants = await collectDescendants(child.id);
      all.push(...descendants);
    }
  }
  return all;
}

export async function DELETE(
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

    const node = await db.query.fsNodes.findFirst({
      where: and(
        eq(schema.fsNodes.id, nodeId),
        eq(schema.fsNodes.workspaceId, id)
      ),
    });
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    // Collect all nodes to delete (the node itself + descendants if folder)
    const nodesToDelete = [node];
    if (node.type === 'folder') {
      const descendants = await collectDescendants(nodeId);
      nodesToDelete.push(...descendants);
    }

    // Delete disk files and associated attachment records
    for (const n of nodesToDelete) {
      if (n.storagePath) {
        try {
          await unlink(path.join(process.cwd(), 'public', n.storagePath));
        } catch {
          // File may already be deleted
        }
      }
      if (n.attachmentId) {
        await db.delete(schema.attachments).where(eq(schema.attachments.id, n.attachmentId));
      }
    }

    // Delete all nodes (children first due to potential parentId constraints, but since it's not a FK, order doesn't matter)
    const idsToDelete = nodesToDelete.map(n => n.id);
    for (const delId of idsToDelete.reverse()) {
      await db.delete(schema.fsNodes).where(eq(schema.fsNodes.id, delId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workspaces/[id]/files/[nodeId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
