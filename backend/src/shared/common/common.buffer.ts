import { createHash } from 'crypto';
import { fromBuffer as fileTypeFromBuffer } from 'file-type';
import type { Readable } from 'stream';

export function getBufferInfo(buffer: Buffer) {
  const filesizeByte = buffer.length;
  const checksum = createHash('sha256').update(buffer).digest('hex');

  return {
    filesizeByte,
    checksum,
  };
}

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  if (idx === -1 || idx === filename.length - 1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

export async function getMimeType(buffer: Buffer) {
  const mimeInfo = await fileTypeFromBuffer(buffer);
  return mimeInfo?.mime || '';
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
