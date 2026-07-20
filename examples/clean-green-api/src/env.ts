import { z } from "zod";

export const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().int().positive(),
  APP_URL: z.string().url(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function parseEnv(raw: Record<string, string | undefined>): AppEnv {
  return EnvSchema.parse(raw);
}
