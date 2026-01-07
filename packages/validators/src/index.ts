import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  requirements: z.record(z.string(), z.any()).optional(), // Fixed: added key type
  location: z.string().optional(),
});

export const applicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID"),
});
