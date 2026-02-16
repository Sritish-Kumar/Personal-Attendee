import { z } from "zod";

const serverEnvSchema = z.object({
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  ALLOWED_EMAILS: z.string().optional(),
  APP_TIMEZONE: z.string().default("Asia/Kolkata"),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1)
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1)
});

const parseServerEnv = () => {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
};

const parseClientEnv = () => {
  const parsed = clientEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid client environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
};

export type Env = z.infer<typeof serverEnvSchema> & z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;
let cachedClientEnv: ClientEnv | null = null;

export const getServerEnv = (): ServerEnv => {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv();
  }

  return cachedServerEnv;
};

export const getClientEnv = (): ClientEnv => {
  if (!cachedClientEnv) {
    cachedClientEnv = parseClientEnv();
  }

  return cachedClientEnv;
};

export const getEnv = (): Env => ({ ...getServerEnv(), ...getClientEnv() });
