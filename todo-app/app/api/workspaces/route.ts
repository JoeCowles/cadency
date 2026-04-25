import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and, sql, inArray, isNull } from 'drizzle-orm';
import { createWorkspaceSchema } from '@/lib/validators/workspace';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    // Get workspace IDs for the current user
    const memberships = await db
      .select({ workspaceId: schema.workspaceMembers.workspaceId })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, user.id!));

    const workspaceIds = memberships.map((m) => m.workspaceId);
    if (workspaceIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch workspaces
    const workspaces = await db
      .select()
      .from(schema.workspaces)
      .where(inArray(schema.workspaces.id, workspaceIds));

    // Get member counts and board counts for each workspace
    const enriched = await Promise.all(
      workspaces.map(async (ws) => {
        const [memberCountResult, boardCountResult] = await Promise.all([
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.workspaceMembers)
            .where(eq(schema.workspaceMembers.workspaceId, ws.id)),
          db
            .select({ count: sql<number>`count(*)` })
            .from(schema.boards)
            .where(
              and(
                eq(schema.boards.workspaceId, ws.id),
                isNull(schema.boards.archivedAt)
              )
            ),
        ]);

        return {
          ...ws,
          memberCount: Number(memberCountResult[0]?.count ?? 0),
          boardCount: Number(boardCountResult[0]?.count ?? 0),
        };
      })
    );

    return NextResponse.json({ workspaces: enriched });
  } catch (error) {
    console.error('GET /api/workspaces error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Create workspace
    const [workspace] = await db
      .insert(schema.workspaces)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        color: parsed.data.color,
        createdBy: user.id!,
      })
      .returning();

    // Add creator as admin member
    await db.insert(schema.workspaceMembers).values({
      workspaceId: workspace.id,
      userId: user.id!,
      role: 'admin',
    });

    // Create default labels
    const defaultLabels = [
      { text: 'Social', color: 'purple' },
      { text: 'Content', color: 'blue' },
      { text: 'Design', color: 'pink' },
      { text: 'Urgent', color: 'red' },
      { text: 'Review', color: 'yellow' },
      { text: 'Approved', color: 'green' },
      { text: 'Research', color: 'orange' },
    ];

    await db.insert(schema.labels).values(
      defaultLabels.map((label) => ({
        workspaceId: workspace.id,
        text: label.text,
        color: label.color,
      }))
    );

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
