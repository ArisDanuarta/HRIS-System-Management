import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  HRIS_URL: z.string().url().default("http://localhost:3001"),
  SYSMGMT_URL: z.string().url().default("http://localhost:3002"),
  AUTH_SECRET: z.string().min(32),
  AUTH_COOKIE_DOMAIN: z.string().optional().default(""),
  DATA_ENCRYPTION_KEY: z.string().min(32),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./.data/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
  APP_TIMEZONE: z.string().default("Asia/Jakarta"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) return parsedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }

  parsedEnv = result.data;
  return parsedEnv;
}
