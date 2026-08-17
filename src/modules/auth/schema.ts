import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(128, "Password terlalu panjang.")
  .regex(/[A-Z]/, "Password harus memiliki huruf besar.")
  .regex(/[a-z]/, "Password harus memiliki huruf kecil.")
  .regex(/[0-9]/, "Password harus memiliki angka.");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({ token: z.string().min(32) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
