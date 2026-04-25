import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateMemberRoleSchema } from '@/lib/validators/workspace';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = updateMemberRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const [member] = await db
      .update(schema.workspaceMembers)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, id),
          eq(schema.workspaceMembers.userId, userId)
        )
      )
      .returning();

    return NextResponse.json(member);
  } catch (error) {
    console.error('PATCH /api/workspaces/[id]/members/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    await db
      .delete(schema.workspaceMembers)
      .where(
        and(
          eq(schema.workspaceMembers.workspaceId, id),
          eq(schema.workspaceMembers.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/workspaces/[id]/members/[userId] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
