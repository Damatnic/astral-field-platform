/**
 * Comprehensive Zod validation schemas for Astral Field
 * Provides type-safe validation for all API inputs
 */

import { z } from 'zod';

// ===== PRIMITIVE SCHEMAS =====

export const sanitizedStringSchema = z.string()
  .min(1)
  .max(10000)
  .refine(
    (val) => !/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(val),
    { message: "Script tags are not allowed" }
  )
  .refine(
    (val) => !/on\w+\s*=/gi.test(val),
    { message: "Event handlers are not allowed" }
  )
  .refine(
    (val) => !/javascript:/gi.test(val),
    { message: "JavaScript URLs are not allowed" }
  );

export const emailSchema = z.string()
  .email("Invalid email format")
  .min(5)
  .max(254)
  .toLowerCase()
  .refine(
    (val) => !val.includes('..'),
    { message: "Consecutive dots are not allowed" }
  );

export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be no more than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
  .refine(
    (val) => !val.startsWith('-') && !val.endsWith('-'),
    { message: "Username cannot start or end with a hyphen" }
  );

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be no more than 128 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number");

export const idSchema = z.string()
  .uuid("Invalid ID format")
  .or(z.string().regex(/^[a-zA-Z0-9_-]+$/, "ID contains invalid characters"));

export const positiveIntSchema = z.number()
  .int("Must be an integer")
  .positive("Must be a positive number")
  .max(2147483647, "Value too large");

export const paginationSchema = z.object({
  page: z.number().int().positive().max(10000).default(1),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).max(1000000).optional(),
});

// ===== USER SCHEMAS =====

export const userRegistrationSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, "Must accept terms"),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const userUpdateSchema = z.object({
  username: usernameSchema.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: "Passwords do not match", path: ["confirmPassword"] }
);

// ===== LEAGUE SCHEMAS =====

export const leagueSettingsSchema = z.object({
  scoringType: z.enum(['standard', 'ppr', 'half-ppr', 'superflex']),
  teamCount: z.number().int().min(4).max(16),
  playoffTeams: z.number().int().min(2).max(8),
  playoffWeekStart: z.number().int().min(13).max(17),
  rosterPositions: z.object({
    QB: z.number().int().min(0).max(4),
    RB: z.number().int().min(0).max(6),
    WR: z.number().int().min(0).max(8),
    TE: z.number().int().min(0).max(4),
    FLEX: z.number().int().min(0).max(4),
    K: z.number().int().min(0).max(2),
    DST: z.number().int().min(0).max(2),
    BENCH: z.number().int().min(4).max(10),
  }),
  tradeDeadline: z.number().int().min(1).max(17),
  waiverType: z.enum(['faab', 'rolling', 'reverse']),
  faabBudget: z.number().int().min(0).max(10000).optional(),
});

export const leagueCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean(),
  password: z.string().min(4).max(50).optional(),
  settings: leagueSettingsSchema,
  inviteEmails: z.array(emailSchema).max(15).optional(),
});

export const leagueUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  password: z.string().min(4).max(50).optional(),
  settings: leagueSettingsSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

export const leagueJoinSchema = z.object({
  leagueId: idSchema,
  password: z.string().max(50).optional(),
  teamName: z.string().min(1).max(50).optional(),
});

// ===== PLAYER SCHEMAS =====

export const playerPositionSchema = z.enum(['QB', 'RB', 'WR', 'TE', 'K', 'DST']);

export const playerSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  position: playerPositionSchema,
  team: z.string().min(2).max(5),
  byeWeek: z.number().int().min(1).max(18).optional(),
  isActive: z.boolean().default(true),
});

export const playerStatsSchema = z.object({
  playerId: idSchema,
  week: z.number().int().min(1).max(18),
  season: z.number().int().min(2020).max(2030),
  points: z.number().min(0).max(100),
  stats: z.record(z.string(), z.number()).optional(),
});

export const playerSearchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  position: playerPositionSchema.optional(),
  team: z.string().min(2).max(5).optional(),
  available: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// ===== ROSTER SCHEMAS =====

export const rosterMoveSchema = z.object({
  action: z.enum(['add', 'drop', 'start', 'bench', 'trade']),
  playerId: idSchema,
  targetPlayerId: idSchema.optional(),
  position: playerPositionSchema.optional(),
});

export const lineupSchema = z.object({
  week: z.number().int().min(1).max(18),
  lineup: z.record(
    z.enum(['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'DST']),
    idSchema
  ),
});

// ===== TRADE SCHEMAS =====

const tradeOfferBaseSchema = z.object({
  fromTeamId: idSchema,
  toTeamId: idSchema,
  offeredPlayers: z.array(idSchema).min(1).max(10),
  requestedPlayers: z.array(idSchema).min(1).max(10),
  message: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const tradeOfferSchema = tradeOfferBaseSchema.refine(
  (data) => data.fromTeamId !== data.toTeamId,
  { message: "Cannot trade with yourself" }
);

export const tradeResponseSchema = z.object({
  tradeId: idSchema,
  action: z.enum(['accept', 'decline', 'counter']),
  counterOffer: tradeOfferBaseSchema.omit({ fromTeamId: true, toTeamId: true }).optional(),
  message: z.string().max(500).optional(),
});

// ===== CHAT SCHEMAS =====

export const chatMessageSchema = z.object({
  leagueId: idSchema,
  roomType: z.enum(['general', 'trades', 'waivers', 'off-topic']),
  content: z.string().min(1).max(2000),
  messageType: z.enum(['text', 'image', 'gif', 'trade', 'poll']).default('text'),
  replyToId: idSchema.optional(),
  mentions: z.array(idSchema).max(10).optional(),
});

export const chatReactionSchema = z.object({
  messageId: idSchema,
  reaction: z.enum(['like', 'dislike', 'laugh', 'angry', 'love', 'fire']),
});

export const chatModerationSchema = z.object({
  messageId: idSchema,
  action: z.enum(['delete', 'hide', 'warn', 'timeout']),
  reason: z.string().max(200).optional(),
  duration: z.number().int().min(1).max(10080).optional(), // minutes, max 1 week
});

// ===== WAIVER SCHEMAS =====

export const waiverClaimSchema = z.object({
  playerId: idSchema,
  dropPlayerId: idSchema.optional(),
  priority: z.number().int().min(1).max(16),
  bidAmount: z.number().int().min(0).max(10000).optional(),
});

// ===== DRAFT SCHEMAS =====

export const draftPickSchema = z.object({
  playerId: idSchema,
  round: z.number().int().min(1).max(20),
  pick: z.number().int().min(1).max(320),
  timeRemaining: z.number().int().min(0).optional(),
});

export const draftSettingsSchema = z.object({
  type: z.enum(['snake', 'linear', 'auction']),
  timePerPick: z.number().int().min(30).max(300), // seconds
  startDate: z.string().datetime(),
  rounds: z.number().int().min(10).max(20),
  auctionBudget: z.number().int().min(100).max(1000).optional(),
});

// ===== QUERY PARAMETER SCHEMAS =====

export const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().max(10000).default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().max(50).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
  filter: z.string().max(200).optional(),
});

// ===== API RESPONSE SCHEMAS =====

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
  }).optional(),
});

// ===== ADMIN SCHEMAS =====

export const adminActionSchema = z.object({
  action: z.enum(['suspend_user', 'delete_league', 'reset_password', 'moderate_content']),
  targetId: idSchema,
  reason: z.string().min(1).max(500),
  duration: z.number().int().min(1).max(365).optional(), // days
  notifyUser: z.boolean().default(true),
});

// ===== FILE UPLOAD SCHEMAS =====

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['avatar', 'league_logo', 'attachment']),
  maxSize: z.number().int().max(10 * 1024 * 1024), // 10MB
}).refine(
  (data) => data.file.size <= data.maxSize,
  { message: "File size exceeds limit" }
).refine(
  (data) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(data.file.type),
  { message: "Invalid file type" }
);

// ===== WEBHOOK SCHEMAS =====

export const webhookSchema = z.object({
  url: z.string().url().refine(
    (url) => !url.includes('localhost') && !url.includes('127.0.0.1'),
    { message: "Localhost URLs are not allowed" }
  ),
  events: z.array(z.enum(['trade', 'waiver', 'score_update', 'draft_pick'])).min(1),
  secret: z.string().min(16).max(64),
  active: z.boolean().default(true),
});