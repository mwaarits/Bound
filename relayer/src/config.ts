import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  RPC_URL: z.string().url(),
  CHAIN_ID: z.coerce.number().int().positive(),
  MOCKIDRX_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  CAMPAIGN_FACTORY_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  CAMPAIGN_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  RELAYER_PRIVATE_KEY: z.string().min(1), // accepts placeholder or real 0x-hex key
  MASTER_KEY: z.string().min(1),           // accepts placeholder or real 0x-hex key
  JWT_SECRET: z.string().min(32),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  OTP_MODE: z.enum(['mock', 'provider']).default('mock'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(): Config {
  return EnvSchema.parse(process.env);
}
