import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createFolderSchema } from '@/lib/validators/files';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, parentId } = parsed.data;

    // Verify parent exists if specified
    if (parentId) {
      const parent = await db.query.fsNodes.findFirst({
        where: and(
          eq(schema.fsNodes.id, parentId),
          eq(schema.fsNodes.workspaceId, id),
          eq(schema.fsNodes.type, 'folder')
        ),
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }
    }

    const [folder] = await db
      .insert(schema.fsNodes)
      .values({
        workspaceId: id,
        parentId: parentId || null,
        name,
        type: 'folder',
        uploadedBy: user.id!,
      })
      .returning();

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/files/folder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
