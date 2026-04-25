import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const relPath = `/uploads/${id}/${filename}`;
    const dirPath = path.join(process.cwd(), 'public', 'uploads', id);

    // Ensure the upload directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dirPath, filename), buffer);

    // Store reference in the database
    const [attachment] = await db
      .insert(schema.attachments)
      .values({
        cardId: id,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        storagePath: relPath,
        uploadedBy: user.id!,
      })
      .returning();

    // Sync to workspace file system
    try {
      // Resolve card's workspace: cards -> lists -> boards
      const card = await db.query.cards.findFirst({ where: eq(schema.cards.id, id) });
      if (card) {
        const list = await db.query.lists.findFirst({ where: eq(schema.lists.id, card.listId) });
        if (list) {
          const board = await db.query.boards.findFirst({ where: eq(schema.boards.id, list.boardId) });
          if (board) {
            // Find or create card folder
            let cardFolder = await db.query.fsNodes.findFirst({
              where: and(
                eq(schema.fsNodes.workspaceId, board.workspaceId),
                eq(schema.fsNodes.cardId, id),
                eq(schema.fsNodes.type, 'folder')
              ),
            });
            if (!cardFolder) {
              const [created] = await db
                .insert(schema.fsNodes)
                .values({
                  workspaceId: board.workspaceId,
                  parentId: null,
                  name: card.title,
                  type: 'folder',
                  cardId: id,
                  uploadedBy: user.id!,
                })
                .returning();
              cardFolder = created;
            }
            // Create file node under card folder
            await db.insert(schema.fsNodes).values({
              workspaceId: board.workspaceId,
              parentId: cardFolder.id,
              name: file.name,
              type: 'file',
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              storagePath: relPath,
              attachmentId: attachment.id,
              uploadedBy: user.id!,
            });
          }
        }
      }
    } catch (fsError) {
      // Don't fail the attachment upload if fs sync fails
      console.error('Failed to sync attachment to file system:', fsError);
    }

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('POST /api/cards/[id]/attachments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const attachments = await db
      .select()
      .from(schema.attachments)
      .where(eq(schema.attachments.cardId, id))
      .orderBy(desc(schema.attachments.createdAt));

    return NextResponse.json(attachments);
  } catch (error) {
    console.error('GET /api/cards/[id]/attachments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
