import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

async function checkMembership(workspaceId: string, userId: string) {
  return db.query.workspaceMembers.findFirst({
    where: and(
      eq(schema.workspaceMembers.workspaceId, workspaceId),
      eq(schema.workspaceMembers.userId, userId)
    ),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const membership = await checkMembership(id, user.id!);
    if (!membership) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const parentCondition = parentId
      ? eq(schema.fsNodes.parentId, parentId)
      : isNull(schema.fsNodes.parentId);

    const nodes = await db
      .select()
      .from(schema.fsNodes)
      .where(and(
        eq(schema.fsNodes.workspaceId, id),
        parentCondition
      ))
      .orderBy(asc(schema.fsNodes.type), asc(schema.fsNodes.name));

    return NextResponse.json(nodes);
  } catch (error) {
    console.error('GET /api/workspaces/[id]/files error:', error);
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

    const membership = await checkMembership(id, user.id!);
    if (!membership) {
      return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parentId = formData.get('parentId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify parent folder exists and belongs to this workspace
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

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const relPath = `/uploads/workspace/${id}/${filename}`;
    const dirPath = path.join(process.cwd(), 'public', 'uploads', 'workspace', id);

    await mkdir(dirPath, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dirPath, filename), buffer);

    const [node] = await db
      .insert(schema.fsNodes)
      .values({
        workspaceId: id,
        parentId: parentId || null,
        name: file.name,
        type: 'file',
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        storagePath: relPath,
        uploadedBy: user.id!,
      })
      .returning();

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/files error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
