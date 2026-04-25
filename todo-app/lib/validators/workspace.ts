import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  color: z.enum(['coral', 'magenta', 'amber', 'rose']).default('coral'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.enum(['coral', 'magenta', 'amber', 'rose']).optional(),
  permissions: z.object({
    visibility: z.enum(['private', 'public']),
    boardCreation: z.enum(['admins', 'anyone']),
    membershipRequests: z.enum(['open', 'approval']),
    guestAccess: z.boolean(),
  }).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'observer']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'observer']),
});
