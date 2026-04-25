import { NextResponse, NextRequest } from 'next/server';
import { getUser, unauthorized } from '@/lib/api-auth';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { inviteMemberSchema } from '@/lib/validators/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return unauthorized();

    const members = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        hue: schema.users.hue,
        role: schema.workspaceMembers.role,
        joined_at: schema.workspaceMembers.joinedAt,
      })
      .from(schema.workspaceMembers)
      .innerJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
      .where(eq(schema.workspaceMembers.workspaceId, id));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('GET /api/workspaces/[id]/members error:', error);
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
    const parsed = inviteMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Look up user by email
    const profile = await db.query.users.findFirst({
      where: eq(schema.users.email, parsed.data.email),
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(schema.workspaceMembers.workspaceId, id),
        eq(schema.workspaceMembers.userId, profile.id)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    const [member] = await db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId: id,
        userId: profile.id,
        role: parsed.data.role,
      })
      .returning();

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/[id]/members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
