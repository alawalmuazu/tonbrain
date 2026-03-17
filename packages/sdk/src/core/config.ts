// TonBrain SDK — Configuration
import { z } from 'zod';

export const ConfigSchema = z.object({
  network: z.enum(['mainnet', 'testnet']).default('testnet'),
  mnemonic: z.string().optional(),
  privateKey: z.string().optional(),
  toncenterApiKey: z.string().optional(),
  databasePath: z.string().default('./data/tonbrain.db'),
});

export type TonBrainConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(overrides?: Partial<TonBrainConfig>): TonBrainConfig {
  const raw = {
    network: overrides?.network ?? process.env.NETWORK ?? 'testnet',
    mnemonic: overrides?.mnemonic ?? process.env.MNEMONIC,
    privateKey: overrides?.privateKey ?? process.env.PRIVATE_KEY,
    toncenterApiKey: overrides?.toncenterApiKey ?? process.env.TONCENTER_API_KEY,
    databasePath: overrides?.databasePath ?? process.env.DATABASE_PATH ?? './data/tonbrain.db',
  };

  return ConfigSchema.parse(raw);
}
