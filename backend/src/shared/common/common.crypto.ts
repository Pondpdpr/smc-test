import bcrypt from 'bcryptjs';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { sign, TokenExpiredError, verify } from 'jsonwebtoken';
import { customAlphabet } from 'nanoid';
import type { Tagged } from 'type-fest';
import { v7 } from 'uuid';

import { config } from '@/infra/config';
import type { UserJwtEncoded } from '@/infra/middleware/jwt/jwt.common';

import { ApiException } from '../http/http.exception';
import type { CursorObj } from '../type/type.common';
import myDayjs from './common.dayjs';

const nanoid15 = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 15);
const encryptkey = Buffer.from(config().crypto.aesKey, 'base64');
const jwtConfig = config().jwt;
const encryptAlgo = 'aes-256-gcm';

type DecodedJwt<T> = {
  status: string;
  data: {
    message: T;
    exp?: number | undefined;
    iat?: number | undefined;
  } | null;
};

export type EncodeJwtOptions = {
  noExpire?: boolean;
};
function encodeJwt(
  obj: Record<string, any>,
  salt: string,
  opts?: EncodeJwtOptions,
) {
  return sign({ message: obj }, salt, {
    expiresIn: opts?.noExpire ? '100y' : '1h',
  });
}

function decodeJwt<T>(token: string, salt: string): DecodedJwt<T>['data'] {
  try {
    const data = verify(token, salt) as DecodedJwt<T>['data'];
    return data;
  } catch (errs) {
    if (errs instanceof TokenExpiredError) {
      throw new ApiException(401, 'tokenExpired');
    }

    throw new ApiException(401, 'tokenInvalid');
  }
}

export function hashString(data: string) {
  const hashed = bcrypt.hashSync(data, 10);
  return hashed;
}

export function isMatchedHash(raw: string, hashed: string) {
  const isMatch = bcrypt.compareSync(raw, hashed);
  return isMatch;
}

export function encodeUserJwt(entity: UserJwtEncoded) {
  const encoded: UserJwtEncoded = {
    userId: entity.userId,
    accountId: entity.accountId,
  };

  return encodeJwt(encoded, jwtConfig.salt, {
    noExpire: jwtConfig.noExpire,
  });
}

export function decodeUserJwt(token: string, salt: string) {
  return decodeJwt<UserJwtEncoded>(token, salt);
}

export function encryptMessage(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(encryptAlgo, encryptkey, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptMessage(encryptedBase64: string): string {
  try {
    const data = Buffer.from(encryptedBase64, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const encrypted = data.subarray(28);

    const decipher = createDecipheriv(encryptAlgo, encryptkey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch (error) {
    throw new ApiException(500, 'errorDecryption', { error });
  }
}

export function encryptObject(obj: Record<string, any>): string {
  return encryptMessage(JSON.stringify(obj));
}

export function decryptObject<T>(encrypted: string): T {
  const decrypted = decryptMessage(encrypted);

  return JSON.parse(decrypted);
}

export type UID = Tagged<string, 'UID'>;
export function generateUID(): UID {
  const ddd = myDayjs().dayOfYear().toString().padStart(3, '0');
  return `${nanoid15()}${ddd}` as UID;
}

export function uuidV7() {
  return v7();
}

export function encodeCursor(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, ''); // URL-safe
}

// --- Decode cursor ---
export function decodeCursor<T = CursorObj<string, any>>(cursor: string): T {
  const b64 =
    cursor.replace(/-/g, '+').replace(/_/g, '/') +
    '==='.slice((cursor.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export function randHex() {
  return randomBytes(32).toString('hex');
}
export function shaHashstring(message?: string) {
  message ??= randHex();
  return createHash('sha256').update(message).digest('hex');
}
