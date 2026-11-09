import { z } from 'zod';

// --- Identity & Auth ---
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthVerifyResponseSchema = z.object({
  authenticated: z.boolean(),
  userId: z.string().uuid().optional(),
});

export type AuthVerifyResponse = z.infer<typeof AuthVerifyResponseSchema>;

// --- AI & Chat ---
export const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  reply: z.string(),
  provider: z.enum(['ollama', 'gemini', 'workers-ai', 'groq']),
  fallback: z.boolean().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// --- Device Registry ---
export const DevicePlatformSchema = z.enum(['android', 'windows', 'linux', 'web']);

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1),
  platform: DevicePlatformSchema,
  osVersion: z.string(),
  appVersion: z.string(),
  lastSeen: z.string().datetime(),
  status: z.enum(['online', 'offline', 'reconnecting']),
});

export type Device = z.infer<typeof DeviceSchema>;

export const DevicePairingRequestSchema = z.object({
  pairingCode: z.string().length(6),
  deviceName: z.string().min(1),
  platform: DevicePlatformSchema,
});

export type DevicePairingRequest = z.infer<typeof DevicePairingRequestSchema>;
