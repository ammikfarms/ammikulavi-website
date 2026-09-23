import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be 30 characters or fewer")
    .optional()
    .or(z.literal("")),
  subject: z
    .string()
    .trim()
    .max(200, "Subject must be 200 characters or fewer")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(4000, "Message must be 4000 characters or fewer"),
  // Honeypot — must be empty; bots auto-fill hidden fields
  website: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
