import '../shared/common/common.dotenv';

import { get } from 'env-var';

export type AppConfig = {
  app: {
    nodeEnv: string;
    apiPort: number;
    workerPort: number;
    cronPort: number;
    memThreshold: number;
    enableSwagger: boolean;
    enableJsonLog: boolean;
    enableCache: boolean;
    enableErrorDetails: boolean;
    cookieSecret: string;
    corsOrigin: string[];
    frontendUrl: string;
  };
  database: {
    url: string;
    sslCaPath: string;
    sslCertPath: string;
    enableLog: boolean;
    enableAutoMigrate: boolean;
  };
  storage: {
    enable: boolean;
    region: string;
    accessKey: string;
    secretKey: string;
    endpoint: string;
    enableForcePath: boolean;
    defaultBucket: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
  };
  jwt: {
    salt: string;
    noExpire: boolean;
  };
  redis: {
    url: string;
  };
  amqp: {
    url: string;
  };
  crypto: {
    aesKey: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  usage: {
    // Per-user spend limit and reset window - lower via env for fast local
    // testing (USAGE_LIMIT_USD=0.001 USAGE_RESET_INTERVAL_SECONDS=180).
    limitUsd: number;
    resetIntervalSeconds: number;
  };
};

export const config = (): AppConfig => ({
  app: {
    nodeEnv: get('NODE_ENV').default('local').asString(),
    apiPort: get('API_PORT').default(3000).asPortNumber(),
    corsOrigin: get('CORS_ORIGIN').required().asString().split(','),
    cookieSecret: get('COOKIE_SECRET').required().asString(),
    frontendUrl: get('FRONTEND_URL')
      .default('http://localhost:5173')
      .asString(),
    workerPort: get('WORKER_PORT').default(3001).asPortNumber(),
    cronPort: get('CRON_PORT').default(3002).asPortNumber(),
    enableSwagger: get('ENABLE_SWAGGER').default('true').asBool(),
    enableJsonLog: get('ENABLE_JSON_LOG').default('true').asBool(),
    enableErrorDetails: get('ENABLE_ERROR_DETAILS').default('true').asBool(),
    enableCache: get('ENABLE_CACHE').default('false').asBool(),
    memThreshold: get('MEM_THRESHOLD')
      .default(150 * 1024 * 1024)
      .asIntPositive(),
  },
  database: {
    url: get('DATABASE_URL').required().asString(),
    sslCaPath: get('DATABASE_SSL_CA_PATH').default('').asString(),
    sslCertPath: get('DATABASE_SSL_CERT_PATH').default('').asString(),
    enableLog: get('ENABLE_DB_LOG').default('false').asBool(),
    enableAutoMigrate: get('ENABLE_AUTO_MIGRATE').default('false').asBool(),
  },
  storage: {
    enable: get('ENABLE_STORAGE').default('false').asBool(),
    region: get('STORAGE_REGION').default('auto').asString(),
    accessKey: get('STORAGE_ACCESS_KEY').required().asString(),
    secretKey: get('STORAGE_SECRET_KEY').required().asString(),
    endpoint: get('STORAGE_ENDPOINT')
      .default('http://localhost:9000')
      .asString(),
    defaultBucket: get('STORAGE_DEFAULT_BUCKET').default('app').asString(),
    enableForcePath: get('ENABLE_STORAGE_FORCE_PATH').default('false').asBool(),
  },
  email: {
    host: get('EMAIL_HOST').default('localhost').asString(),
    port: get('EMAIL_PORT').default(1025).asPortNumber(),
    secure: get('EMAIL_SECURE').default('false').asBool(),
    user: get('EMAIL_USER').default('').asString(),
    password: get('EMAIL_PASSWORD').default('').asString(),
    from: get('EMAIL_FROM').default('app@example.com').asString(),
  },
  jwt: {
    salt: get('JWT_SALT').required().asString(),
    noExpire: get('JWT_NO_EXPIRE').default('false').asBool(),
  },
  redis: {
    url: get('REDIS_URL').default('redis://localhost:6379').asString(),
  },
  amqp: {
    url: get('AMQP_URL')
      .default('amqp://admin:admin@localhost:5672')
      .asString(),
  },
  crypto: {
    aesKey: get('AES_KEY').required().asString(),
  },
  openai: {
    apiKey: get('OPENAI_API_KEY').default('').asString(),
    model: get('OPENAI_MODEL').default('gpt-4o-mini').asString(),
  },
  usage: {
    limitUsd: get('USAGE_LIMIT_USD').default(1).asFloat(),
    resetIntervalSeconds: get('USAGE_RESET_INTERVAL_SECONDS')
      .default(3600)
      .asIntPositive(),
  },
});
