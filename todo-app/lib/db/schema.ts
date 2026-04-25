import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  jsonb,
  integer,
  boolean,
  bigint,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ══════════════════════════════════════════════════════════════════════
// NextAuth tables
// ══════════════════════════════════════════════════════════════════════

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('password_hash'),
  hue: smallint('hue').notNull().default(1),
  preferences: jsonb('preferences').notNull().default({
    theme: 'dark',
    boardDensity: 'comfortable',
    cardVariant: 'default',
    accentHue: 30,
    blobsAnimated: true,
  }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ══════════════════════════════════════════════════════════════════════
// Axior domain tables
// ══════════════════════════════════════════════════════════════════════

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  color: text('color').notNull().default('coral'),
  permissions: jsonb('permissions').notNull().default({
    visibility: 'private',
    boardCreation: 'admins',
    membershipRequests: 'approval',
    guestAccess: false,
  }),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (wm) => [primaryKey({ columns: [wm.workspaceId, wm.userId] })]
);

export const workspaceInvites = pgTable('workspace_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'),
  token: text('token').notNull().unique(),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  gradient: text('gradient').notNull(),
  scope: text('scope').notNull().default('workspace'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  archivedAt: timestamp('archived_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const boardMembers = pgTable(
  'board_members',
  {
    boardId: uuid('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('editor'),
    joinedAt: timestamp('joined_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (bm) => [primaryKey({ columns: [bm.boardId, bm.userId] })]
);

export const boardStars = pgTable(
  'board_stars',
  {
    boardId: uuid('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    starredAt: timestamp('starred_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (bs) => [primaryKey({ columns: [bs.boardId, bs.userId] })]
);

export const lists = pgTable('lists', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  archivedAt: timestamp('archived_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id')
    .notNull()
    .references(() => lists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  cover: text('cover'),
  dueDate: timestamp('due_date', { mode: 'date' }),
  startTime: text('start_time'),
  endTime: text('end_time'),
  position: integer('position').notNull().default(0),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  archivedAt: timestamp('archived_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const cardLabels = pgTable(
  'card_labels',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
  },
  (cl) => [primaryKey({ columns: [cl.cardId, cl.labelId] })]
);

export const cardMembers = pgTable(
  'card_members',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (cm) => [primaryKey({ columns: [cm.cardId, cm.userId] })]
);

export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  done: boolean('done').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),
  mimeType: text('mime_type').notNull(),
  storagePath: text('storage_path').notNull(),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id')
    .notNull()
    .references(() => cards.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id),
  text: text('text').notNull(),
  editedAt: timestamp('edited_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const activity = pgTable('activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  boardId: uuid('board_id').references(() => boards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  target: text('target'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const fsNodes = pgTable('fs_nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'file' | 'folder'
  mimeType: text('mime_type'),
  size: bigint('size', { mode: 'number' }),
  storagePath: text('storage_path'),
  cardId: uuid('card_id').references(() => cards.id, { onDelete: 'set null' }),
  attachmentId: uuid('attachment_id').references(() => attachments.id, { onDelete: 'set null' }),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activityId: uuid('activity_id').references(() => activity.id, {
    onDelete: 'cascade',
  }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  unread: boolean('unread').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});
