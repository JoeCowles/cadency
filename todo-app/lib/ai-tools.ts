import type Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// ── Tool definitions ──────────────────────────────────────────────────────

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Anthropic.Tool.InputSchema;
  destructive?: boolean;
}

export const AI_TOOLS: ToolDef[] = [
  // ── Workspaces ──
  {
    name: 'list_workspaces',
    description: 'List all workspaces the user is a member of, with member and board counts.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'create_workspace',
    description: 'Create a new workspace.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Workspace name' },
        description: { type: 'string', description: 'Optional description' },
        color: { type: 'string', enum: ['coral', 'magenta', 'amber', 'rose'] },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_workspace',
    description: 'Update workspace name, description, or color.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string', enum: ['coral', 'magenta', 'amber', 'rose'] },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'delete_workspace',
    description: 'Permanently delete a workspace and all its data. Cannot be undone.',
    input_schema: {
      type: 'object' as const,
      properties: { workspace_id: { type: 'string' } },
      required: ['workspace_id'],
    },
    destructive: true,
  },
  // ── Boards ──
  {
    name: 'list_boards',
    description: 'List all boards in a workspace.',
    input_schema: {
      type: 'object' as const,
      properties: { workspace_id: { type: 'string' } },
      required: ['workspace_id'],
    },
  },
  {
    name: 'create_board',
    description: 'Create a new board in a workspace.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        name: { type: 'string', description: 'Board name' },
        description: { type: 'string' },
        scope: { type: 'string', enum: ['private', 'workspace', 'public'] },
      },
      required: ['workspace_id', 'name'],
    },
  },
  {
    name: 'update_board',
    description: 'Update board name or description.',
    input_schema: {
      type: 'object' as const,
      properties: {
        board_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['board_id'],
    },
  },
  {
    name: 'delete_board',
    description: 'Archive/delete a board.',
    input_schema: {
      type: 'object' as const,
      properties: { board_id: { type: 'string' } },
      required: ['board_id'],
    },
    destructive: true,
  },
  {
    name: 'get_board_detail',
    description: 'Get full board detail including all lists and their cards. Use this to understand the current state of a board before making changes.',
    input_schema: {
      type: 'object' as const,
      properties: { board_id: { type: 'string' } },
      required: ['board_id'],
    },
  },
  // ── Lists ──
  {
    name: 'create_list',
    description: 'Create a new list (column) on a board.',
    input_schema: {
      type: 'object' as const,
      properties: {
        board_id: { type: 'string' },
        name: { type: 'string', description: 'List name' },
      },
      required: ['board_id', 'name'],
    },
  },
  {
    name: 'update_list',
    description: 'Rename a list.',
    input_schema: {
      type: 'object' as const,
      properties: {
        list_id: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['list_id'],
    },
  },
  {
    name: 'delete_list',
    description: 'Archive/delete a list and all its cards.',
    input_schema: {
      type: 'object' as const,
      properties: { list_id: { type: 'string' } },
      required: ['list_id'],
    },
    destructive: true,
  },
  // ── Cards ──
  {
    name: 'create_card',
    description: 'Create a new card (task) in a list. Also creates a corresponding folder in the workspace file system.',
    input_schema: {
      type: 'object' as const,
      properties: {
        list_id: { type: 'string', description: 'List ID to add the card to' },
        title: { type: 'string' },
        description: { type: 'string' },
        due_date: { type: 'string', description: 'Due date ISO format (YYYY-MM-DD)' },
      },
      required: ['list_id', 'title'],
    },
  },
  {
    name: 'update_card',
    description: 'Update card title, description, or due date. If the title changes, the card\'s folder in the file system is also renamed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        card_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        due_date: { type: 'string', description: 'ISO date or null to clear' },
      },
      required: ['card_id'],
    },
  },
  {
    name: 'delete_card',
    description: 'Archive/delete a card and its associated folder in the file system.',
    input_schema: {
      type: 'object' as const,
      properties: { card_id: { type: 'string' } },
      required: ['card_id'],
    },
    destructive: true,
  },
  {
    name: 'move_card',
    description: 'Move a card to a different list or position.',
    input_schema: {
      type: 'object' as const,
      properties: {
        card_id: { type: 'string' },
        list_id: { type: 'string', description: 'Target list ID' },
        position: { type: 'number', description: 'Position in target list (0-indexed)' },
      },
      required: ['card_id', 'list_id', 'position'],
    },
  },
  // ── Members ──
  {
    name: 'list_workspace_members',
    description: 'List all members of a workspace with their roles.',
    input_schema: {
      type: 'object' as const,
      properties: { workspace_id: { type: 'string' } },
      required: ['workspace_id'],
    },
  },
  {
    name: 'invite_member',
    description: 'Invite a user to a workspace by email.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['admin', 'member', 'observer'] },
      },
      required: ['workspace_id', 'email'],
    },
  },
  {
    name: 'remove_member',
    description: 'Remove a member from a workspace.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        user_id: { type: 'string' },
      },
      required: ['workspace_id', 'user_id'],
    },
    destructive: true,
  },
  // ── File System ──
  {
    name: 'list_files',
    description: 'List files and folders in a workspace directory. Omit parent_id to list root-level items.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        parent_id: { type: 'string', description: 'Parent folder ID. Omit for root level.' },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'create_folder',
    description: 'Create a new folder in the workspace file system.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        name: { type: 'string', description: 'Folder name' },
        parent_id: { type: 'string', description: 'Parent folder ID. Omit for root level.' },
      },
      required: ['workspace_id', 'name'],
    },
  },
  {
    name: 'rename_file_node',
    description: 'Rename a file or folder in the workspace file system.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        node_id: { type: 'string', description: 'ID of the file or folder to rename' },
        name: { type: 'string', description: 'New name' },
      },
      required: ['workspace_id', 'node_id', 'name'],
    },
  },
  {
    name: 'delete_file_node',
    description: 'Delete a file or folder (and all contents if folder) from the workspace file system.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        node_id: { type: 'string', description: 'ID of the file or folder to delete' },
      },
      required: ['workspace_id', 'node_id'],
    },
    destructive: true,
  },
  {
    name: 'move_file_node',
    description: 'Move a file or folder to a different parent folder. Use null parent_id to move to root.',
    input_schema: {
      type: 'object' as const,
      properties: {
        workspace_id: { type: 'string' },
        node_id: { type: 'string', description: 'ID of the file or folder to move' },
        parent_id: { type: 'string', description: 'Target parent folder ID, or null for root' },
      },
      required: ['workspace_id', 'node_id'],
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────

export function getSystemPrompt(
  context: { workspaceId?: string; boardId?: string },
  dangerousMode: boolean,
): string {
  let prompt = `You are Axior AI, a helpful assistant for the Axior project management app. You help users manage their workspaces, boards, lists, cards (tasks), and files.

You have access to tools that let you perform all the actions a user can do in the UI. Use them to fulfill the user's requests efficiently. You can call multiple tools in sequence to complete complex tasks.

Every card (task) has an associated folder in the workspace file system. When you create a card, a folder is automatically created. When you delete a card, its folder is also deleted. You can also manage files and folders directly.

After making changes, briefly summarize what you did.`;

  if (!dangerousMode) {
    prompt += `

IMPORTANT SAFETY RULE: For any destructive actions (deleting workspaces, boards, lists, cards, files/folders, or removing members), you MUST ask the user for explicit confirmation BEFORE calling the destructive tool. Describe exactly what will be affected and ask "Should I proceed?" Wait for their "yes" before executing.`;
  } else {
    prompt += `

The user has enabled dangerous mode. You may execute destructive actions without asking for confirmation.`;
  }

  if (context.workspaceId) prompt += `\n\nCurrent workspace ID: ${context.workspaceId}`;
  if (context.boardId) prompt += `\nCurrent board ID: ${context.boardId}`;

  return prompt;
}

// ── Undo operations ───────────────────────────────────────────────────────

export interface UndoOperation {
  type: 'delete_created' | 'restore_updated' | 'unarchive';
  entity: string;
  id: string;
  previousData?: Record<string, unknown>;
}

export interface ToolResult {
  output: string;
  undoOp?: UndoOperation;
}

// ── DB helpers for card ↔ folder sync ─────────────────────────────────────

async function resolveWorkspaceForList(listId: string): Promise<string | null> {
  const list = await db.query.lists.findFirst({ where: eq(schema.lists.id, listId) });
  if (!list) return null;
  const board = await db.query.boards.findFirst({ where: eq(schema.boards.id, list.boardId) });
  return board?.workspaceId ?? null;
}

async function resolveWorkspaceForCard(cardId: string): Promise<string | null> {
  const card = await db.query.cards.findFirst({ where: eq(schema.cards.id, cardId) });
  if (!card) return null;
  return resolveWorkspaceForList(card.listId);
}

async function createCardFolder(cardId: string, cardTitle: string, workspaceId: string, userId: string): Promise<string | null> {
  try {
    const [folder] = await db
      .insert(schema.fsNodes)
      .values({
        workspaceId,
        parentId: null,
        name: cardTitle,
        type: 'folder',
        cardId,
        uploadedBy: userId,
      })
      .returning();
    return folder?.id ?? null;
  } catch {
    return null;
  }
}

async function findCardFolder(cardId: string): Promise<{ id: string; workspaceId: string; name: string } | null> {
  const folder = await db.query.fsNodes.findFirst({
    where: and(
      eq(schema.fsNodes.cardId, cardId),
      eq(schema.fsNodes.type, 'folder'),
    ),
  });
  if (!folder) return null;
  return { id: folder.id, workspaceId: folder.workspaceId, name: folder.name };
}

async function deleteCardFolder(cardId: string, baseUrl: string, cookie: string): Promise<string | null> {
  const folder = await findCardFolder(cardId);
  if (!folder) return null;
  const h: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie };
  await fetch(`${baseUrl}/api/workspaces/${folder.workspaceId}/files/${folder.id}`, { method: 'DELETE', headers: h });
  return folder.id;
}

// ── Tool executor ─────────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  baseUrl: string,
  cookie: string,
  context: { workspaceId?: string; boardId?: string },
  userId: string,
): Promise<ToolResult> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie };
  const get = (p: string) => fetch(`${baseUrl}${p}`, { headers: h }).then(r => r.json());
  const post = (p: string, b: unknown) => fetch(`${baseUrl}${p}`, { method: 'POST', headers: h, body: JSON.stringify(b) }).then(r => r.json());
  const patch = (p: string, b: unknown) => fetch(`${baseUrl}${p}`, { method: 'PATCH', headers: h, body: JSON.stringify(b) }).then(r => r.json());
  const del = (p: string) => fetch(`${baseUrl}${p}`, { method: 'DELETE', headers: h }).then(r => r.json());
  const put = (p: string, b: unknown) => fetch(`${baseUrl}${p}`, { method: 'PUT', headers: h, body: JSON.stringify(b) }).then(r => r.json());

  try {
    switch (toolName) {
      // ── Workspaces ──────────────────────────────────────────────────────
      case 'list_workspaces': {
        const data = await get('/api/workspaces');
        return { output: JSON.stringify(data) };
      }

      case 'create_workspace': {
        const data = await post('/api/workspaces', { name: input.name, description: input.description, color: input.color });
        return {
          output: JSON.stringify(data),
          undoOp: data.workspace?.id ? { type: 'delete_created', entity: 'workspace', id: data.workspace.id } : undefined,
        };
      }

      case 'update_workspace': {
        const id = input.workspace_id as string;
        const current = await get(`/api/workspaces/${id}`);
        const body: Record<string, unknown> = {};
        if (input.name !== undefined) body.name = input.name;
        if (input.description !== undefined) body.description = input.description;
        if (input.color !== undefined) body.color = input.color;
        const data = await patch(`/api/workspaces/${id}`, body);
        return {
          output: JSON.stringify(data),
          undoOp: { type: 'restore_updated', entity: 'workspace', id, previousData: { name: current.name, description: current.description, color: current.color } },
        };
      }

      case 'delete_workspace': {
        const id = input.workspace_id as string;
        const data = await del(`/api/workspaces/${id}`);
        return { output: JSON.stringify(data), undoOp: { type: 'unarchive', entity: 'workspace', id } };
      }

      // ── Boards ──────────────────────────────────────────────────────────
      case 'list_boards': {
        const data = await get(`/api/workspaces/${input.workspace_id}/boards`);
        return { output: JSON.stringify(data) };
      }

      case 'create_board': {
        const data = await post(`/api/workspaces/${input.workspace_id}/boards`, {
          name: input.name,
          description: input.description || '',
          gradient: 'linear-gradient(135deg, oklch(0.72 0.18 30), oklch(0.65 0.22 355))',
          scope: input.scope || 'workspace',
        });
        const bid = data.board?.id ?? data.id;
        return { output: JSON.stringify(data), undoOp: bid ? { type: 'delete_created', entity: 'board', id: bid } : undefined };
      }

      case 'update_board': {
        const id = input.board_id as string;
        const current = await get(`/api/boards/${id}`);
        const body: Record<string, unknown> = {};
        if (input.name !== undefined) body.name = input.name;
        if (input.description !== undefined) body.description = input.description;
        const data = await patch(`/api/boards/${id}`, body);
        return {
          output: JSON.stringify(data),
          undoOp: { type: 'restore_updated', entity: 'board', id, previousData: { name: current.name, description: current.description } },
        };
      }

      case 'delete_board': {
        const id = input.board_id as string;
        const data = await del(`/api/boards/${id}`);
        return { output: JSON.stringify(data), undoOp: { type: 'unarchive', entity: 'board', id } };
      }

      case 'get_board_detail': {
        const data = await get(`/api/boards/${input.board_id}`);
        return { output: JSON.stringify(data) };
      }

      // ── Lists ───────────────────────────────────────────────────────────
      case 'create_list': {
        const data = await post(`/api/boards/${input.board_id}/lists`, { name: input.name });
        const lid = data.list?.id ?? data.id;
        return { output: JSON.stringify(data), undoOp: lid ? { type: 'delete_created', entity: 'list', id: lid } : undefined };
      }

      case 'update_list': {
        const id = input.list_id as string;
        const body: Record<string, unknown> = {};
        if (input.name !== undefined) body.name = input.name;
        const data = await patch(`/api/lists/${id}`, body);
        return { output: JSON.stringify(data), undoOp: { type: 'restore_updated', entity: 'list', id, previousData: {} } };
      }

      case 'delete_list': {
        const id = input.list_id as string;
        const data = await del(`/api/lists/${id}`);
        return { output: JSON.stringify(data), undoOp: { type: 'unarchive', entity: 'list', id } };
      }

      // ── Cards (with folder sync) ───────────────────────────────────────
      case 'create_card': {
        const data = await post(`/api/lists/${input.list_id}/cards`, { title: input.title, description: input.description });
        const cid = data.card?.id ?? data.id;
        if (input.due_date && cid) {
          await patch(`/api/cards/${cid}`, { due_date: input.due_date });
        }
        // Create the card's folder in the workspace file system
        let folderId: string | null = null;
        if (cid) {
          const wsId = context.workspaceId || await resolveWorkspaceForList(input.list_id as string);
          if (wsId) {
            folderId = await createCardFolder(cid, input.title as string, wsId, userId);
          }
        }
        return {
          output: JSON.stringify({ ...data, folderId }),
          undoOp: cid ? { type: 'delete_created', entity: 'card', id: cid, previousData: folderId ? { folderId } : undefined } : undefined,
        };
      }

      case 'update_card': {
        const id = input.card_id as string;
        const current = await get(`/api/cards/${id}`);
        const body: Record<string, unknown> = {};
        if (input.title !== undefined) body.title = input.title;
        if (input.description !== undefined) body.description = input.description;
        if (input.due_date !== undefined) body.due_date = input.due_date;
        const data = await patch(`/api/cards/${id}`, body);
        // If title changed, rename the card's folder too
        if (input.title !== undefined && input.title !== current.title) {
          const folder = await findCardFolder(id);
          if (folder) {
            await fetch(`${baseUrl}/api/workspaces/${folder.workspaceId}/files/${folder.id}`, {
              method: 'PATCH', headers: h, body: JSON.stringify({ name: input.title }),
            });
          }
        }
        return {
          output: JSON.stringify(data),
          undoOp: { type: 'restore_updated', entity: 'card', id, previousData: { title: current.title, description: current.description, due_date: current.dueDate } },
        };
      }

      case 'delete_card': {
        const id = input.card_id as string;
        // Find the card's folder before deletion (so we can store info for undo)
        const folder = await findCardFolder(id);
        // Archive the card
        const data = await del(`/api/cards/${id}`);
        // Delete the card's folder
        if (folder) {
          await fetch(`${baseUrl}/api/workspaces/${folder.workspaceId}/files/${folder.id}`, { method: 'DELETE', headers: h });
        }
        return {
          output: JSON.stringify(data),
          undoOp: {
            type: 'unarchive', entity: 'card', id,
            previousData: folder ? { folderName: folder.name, workspaceId: folder.workspaceId } : undefined,
          },
        };
      }

      case 'move_card': {
        const id = input.card_id as string;
        const current = await get(`/api/cards/${id}`);
        const data = await put(`/api/cards/${id}/move`, { listId: input.list_id, position: input.position });
        return {
          output: JSON.stringify(data),
          undoOp: { type: 'restore_updated', entity: 'card_move', id, previousData: { listId: current.listId, position: current.position } },
        };
      }

      // ── Members ─────────────────────────────────────────────────────────
      case 'list_workspace_members': {
        const data = await get(`/api/workspaces/${input.workspace_id}/members`);
        return { output: JSON.stringify(data) };
      }

      case 'invite_member': {
        const data = await post(`/api/workspaces/${input.workspace_id}/members`, { email: input.email, role: input.role || 'member' });
        return { output: JSON.stringify(data) };
      }

      case 'remove_member': {
        const data = await del(`/api/workspaces/${input.workspace_id}/members/${input.user_id}`);
        return { output: JSON.stringify(data) };
      }

      // ── File System ─────────────────────────────────────────────────────
      case 'list_files': {
        const wsId = input.workspace_id as string;
        const parentId = input.parent_id as string | undefined;
        const url = parentId
          ? `/api/workspaces/${wsId}/files?parentId=${parentId}`
          : `/api/workspaces/${wsId}/files`;
        const data = await get(url);
        return { output: JSON.stringify(data) };
      }

      case 'create_folder': {
        const wsId = input.workspace_id as string;
        const data = await post(`/api/workspaces/${wsId}/files/folder`, {
          name: input.name,
          parentId: input.parent_id || null,
        });
        const fid = data.id;
        return {
          output: JSON.stringify(data),
          undoOp: fid ? { type: 'delete_created', entity: 'fs_node', id: fid, previousData: { workspaceId: wsId } } : undefined,
        };
      }

      case 'rename_file_node': {
        const wsId = input.workspace_id as string;
        const nodeId = input.node_id as string;
        // Fetch current name for undo
        const nodes = await get(`/api/workspaces/${wsId}/files`);
        const allNodes = Array.isArray(nodes) ? nodes : [];
        const currentNode = allNodes.find((n: Record<string, unknown>) => n.id === nodeId);
        const data = await patch(`/api/workspaces/${wsId}/files/${nodeId}`, { name: input.name });
        return {
          output: JSON.stringify(data),
          undoOp: {
            type: 'restore_updated', entity: 'fs_node', id: nodeId,
            previousData: { workspaceId: wsId, name: currentNode?.name ?? '' },
          },
        };
      }

      case 'delete_file_node': {
        const wsId = input.workspace_id as string;
        const nodeId = input.node_id as string;
        const data = await del(`/api/workspaces/${wsId}/files/${nodeId}`);
        // File/folder deletes remove from disk - not fully undoable for files
        return { output: JSON.stringify(data) };
      }

      case 'move_file_node': {
        const wsId = input.workspace_id as string;
        const nodeId = input.node_id as string;
        // Fetch current parentId for undo
        const node = await db.query.fsNodes.findFirst({ where: eq(schema.fsNodes.id, nodeId) });
        const data = await put(`/api/workspaces/${wsId}/files/${nodeId}/move`, {
          parentId: input.parent_id ?? null,
        });
        return {
          output: JSON.stringify(data),
          undoOp: {
            type: 'restore_updated', entity: 'fs_move', id: nodeId,
            previousData: { workspaceId: wsId, parentId: node?.parentId ?? null },
          },
        };
      }

      default:
        return { output: `Unknown tool: ${toolName}` };
    }
  } catch (error: unknown) {
    return { output: `Error: ${error instanceof Error ? error.message : 'Tool execution failed'}` };
  }
}

// ── Undo executor ─────────────────────────────────────────────────────────

export async function executeUndo(
  op: UndoOperation,
  baseUrl: string,
  cookie: string,
  userId: string,
): Promise<boolean> {
  const h: Record<string, string> = { 'Content-Type': 'application/json', Cookie: cookie };

  try {
    switch (op.type) {
      case 'delete_created': {
        if (op.entity === 'card') {
          // Also delete the card's folder
          await deleteCardFolder(op.id, baseUrl, cookie);
          await fetch(`${baseUrl}/api/cards/${op.id}`, { method: 'DELETE', headers: h });
          return true;
        }
        if (op.entity === 'fs_node') {
          const wsId = op.previousData?.workspaceId as string;
          if (wsId) {
            await fetch(`${baseUrl}/api/workspaces/${wsId}/files/${op.id}`, { method: 'DELETE', headers: h });
            return true;
          }
          return false;
        }
        const pathMap: Record<string, string> = {
          workspace: `/api/workspaces/${op.id}`,
          board: `/api/boards/${op.id}`,
          list: `/api/lists/${op.id}`,
        };
        const path = pathMap[op.entity];
        if (path) { await fetch(`${baseUrl}${path}`, { method: 'DELETE', headers: h }); return true; }
        return false;
      }

      case 'restore_updated': {
        if (op.entity === 'card_move' && op.previousData) {
          await fetch(`${baseUrl}/api/cards/${op.id}/move`, { method: 'PUT', headers: h, body: JSON.stringify({ listId: op.previousData.listId, position: op.previousData.position }) });
          return true;
        }
        if (op.entity === 'fs_node' && op.previousData) {
          const wsId = op.previousData.workspaceId as string;
          await fetch(`${baseUrl}/api/workspaces/${wsId}/files/${op.id}`, {
            method: 'PATCH', headers: h, body: JSON.stringify({ name: op.previousData.name }),
          });
          return true;
        }
        if (op.entity === 'fs_move' && op.previousData) {
          const wsId = op.previousData.workspaceId as string;
          await fetch(`${baseUrl}/api/workspaces/${wsId}/files/${op.id}/move`, {
            method: 'PUT', headers: h, body: JSON.stringify({ parentId: op.previousData.parentId }),
          });
          return true;
        }
        if (op.entity === 'card' && op.previousData) {
          // Restore card data and also rename folder back if title changed
          await fetch(`${baseUrl}/api/cards/${op.id}`, { method: 'PATCH', headers: h, body: JSON.stringify(op.previousData) });
          if (op.previousData.title) {
            const folder = await findCardFolder(op.id);
            if (folder) {
              await fetch(`${baseUrl}/api/workspaces/${folder.workspaceId}/files/${folder.id}`, {
                method: 'PATCH', headers: h, body: JSON.stringify({ name: op.previousData.title }),
              });
            }
          }
          return true;
        }
        const pathMap: Record<string, string> = {
          workspace: `/api/workspaces/${op.id}`,
          board: `/api/boards/${op.id}`,
          list: `/api/lists/${op.id}`,
        };
        const path = pathMap[op.entity];
        if (path && op.previousData) {
          await fetch(`${baseUrl}${path}`, { method: 'PATCH', headers: h, body: JSON.stringify(op.previousData) });
          return true;
        }
        return false;
      }

      case 'unarchive': {
        if (op.entity === 'workspace') return false;
        if (op.entity === 'card') {
          // Unarchive the card
          await fetch(`${baseUrl}/api/cards/${op.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ archived_at: null }) });
          // Recreate the card's folder if we have the info
          if (op.previousData?.folderName && op.previousData?.workspaceId) {
            await createCardFolder(
              op.id,
              op.previousData.folderName as string,
              op.previousData.workspaceId as string,
              userId,
            );
          }
          return true;
        }
        const pathMap: Record<string, string> = {
          board: `/api/boards/${op.id}`,
          list: `/api/lists/${op.id}`,
        };
        const path = pathMap[op.entity];
        if (path) {
          await fetch(`${baseUrl}${path}`, { method: 'PATCH', headers: h, body: JSON.stringify({ archived_at: null }) });
          return true;
        }
        return false;
      }

      default:
        return false;
    }
  } catch {
    return false;
  }
}
