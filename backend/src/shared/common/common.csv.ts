import { format, parse } from 'fast-csv';

import { ApiException } from '../http/http.exception';
import myDayjs from './common.dayjs';
import { validateCsvFile } from './common.func';

export function writeCsv(data: [string, string | number][][]) {
  const csvStream = format({ headers: true, alwaysWriteHeaders: true });

  data.forEach((row) => csvStream.write(row));

  return csvStream;
}

export function getCsvFileSuffix() {
  return myDayjs().format('YYYY_MM_DD');
}

export function getCsvDateDisplay(date: Date) {
  return myDayjs(date).format('YYYY/MM/DD');
}

type CsvOpts<T extends string> =
  | {
      skipRows?: number;
      headers: true;
      onRow: (info: {
        row: Record<T, string>;
        rowNum: number;
      }) => void | Promise<void>;
    }
  | {
      skipRows?: number;
      headers: false;
      onRow: (info: { row: string[]; rowNum: number }) => void | Promise<void>;
    };

export async function readCsv<T extends string>(
  file: Express.Multer.File,
  opts: CsvOpts<T>,
): Promise<void> {
  validateCsvFile(file);

  let rowNum = 0;
  if (opts?.headers) {
    // skip header
    rowNum++;
  }
  if (opts?.skipRows) {
    // skip rows
    rowNum = rowNum + opts.skipRows;
  }

  const promises: Promise<void>[] = [];
  const processRow = (info: { row: any; rowNum: number }): void => {
    const res = opts.onRow(info);
    if (res instanceof Promise) promises.push(res);
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const parser = parse({
        headers: opts.headers,
        skipRows: opts.skipRows ?? 0,
      });

      parser
        .on('error', reject)
        .on('data', (row) => {
          try {
            processRow({ row, rowNum });
            rowNum++;
          } catch (e) {
            reject(e);
          }
        })
        .on('end', resolve);

      parser.write(file.buffer);
      parser.end();
    });

    await Promise.all(promises);
  } catch (error) {
    throw new ApiException(500, 'invalid', { error });
  }
}
