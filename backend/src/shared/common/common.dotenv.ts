import type { ConfigModuleOptions } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import * as path from 'path';

import { config } from '@/infra/config';

// Initializing dotenv
function getEnvPath(nodeEnv: string | undefined) {
  if (nodeEnv === 'test') {
    return '../../../.env.test';
  }

  if (nodeEnv === 'cli') {
    return '../../../.env';
  }

  return '../../../.env';
}

export function getEnvFullPath() {
  return path.resolve(__dirname, getEnvPath(process.env.NODE_ENV));
}

dotenvConfig({ path: getEnvFullPath(), quiet: true });

export function getConfigOptions(): ConfigModuleOptions {
  return {
    isGlobal: true,
    load: [config],
    ignoreEnvFile: true,
  };
}
