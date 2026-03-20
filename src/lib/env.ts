import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/private_banker"),
  NEXTAUTH_SECRET: z.string().min(1).default("dev-only-secret-change-me"),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_EMAILS: z.string().default(""),
  APP_DEMO_EMAIL: z.string().default("demo@privatebanker.local"),
  APP_DEMO_MODE: z.string().default("true"),
  OPENAI_API_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  FILE_STORAGE_PATH: z.string().default("./storage/documents"),
  ENCRYPTION_KEY: z.string().min(32).default("replace-with-32-char-encryption-key"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const messages = parsed.error.issues.map((issue) => issue.message).join(", ");
  throw new Error(`Invalid environment configuration: ${messages}`);
}

export const env = parsed.data;

export const allowedEmails = new Set(
  env.ALLOWED_EMAILS.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

export const isDemoMode = env.APP_DEMO_MODE.toLowerCase() === "true";
