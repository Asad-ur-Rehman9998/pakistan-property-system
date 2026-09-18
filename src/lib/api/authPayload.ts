import { z } from "zod";

/** Shared auth request shapes — keep route handlers thin. */
export const registerPayload = z.object({
  email: z.string().email().max(120),
  password: z.string().min(10).max(200),
  role: z.enum(["member", "professional"]).default("member"),
});

export const loginPayload = z.object({
  email: z.string().email().max(120),
  password: z.string().min(1).max(200),
  totp: z.string().max(12).optional(),
});

export type RegisterPayload = z.infer<typeof registerPayload>;
export type LoginPayload = z.infer<typeof loginPayload>;
