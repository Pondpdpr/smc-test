import { readFileSync } from 'fs';
import { join } from 'path';

import { Command, CommandRunner } from 'nest-commander';

import { MainDb } from '@/infra/db/db.main';

const COPY_START_MARKER = 'FROM stdin;';
const COPY_END_MARKER = '\n\\.';
const NULL_MARKER = '\\N';

@Command({
  name: 'financial-data:seed',
  description:
    'Load data/financial_data.sql (48 companies, 2022-2025) into the financial_data table',
})
export class FinancialDataCliSeed extends CommandRunner {
  constructor(private db: MainDb) {
    super();
  }

  async run(): Promise<void> {
    const filePath = join(process.cwd(), '..', 'data', 'financial_data.sql');
    const rows = this._parseCopyRows(readFileSync(filePath, 'utf-8'));

    // Idempotent: safe to re-run (financial_data has no other tables depending on it).
    await this.db.write.deleteFrom('financial_data').execute();
    await this.db.write.insertInto('financial_data').values(rows).execute();

    console.log(`Loaded ${rows.length} financial_data rows from ${filePath}`);
  }

  private _parseCopyRows(raw: string) {
    const start = raw.indexOf(COPY_START_MARKER);
    if (start === -1) {
      throw new Error(
        'Could not find "COPY ... FROM stdin;" block in financial_data.sql',
      );
    }

    const afterStart = raw.slice(start + COPY_START_MARKER.length);
    const end = afterStart.indexOf(COPY_END_MARKER);
    const body = end === -1 ? afterStart : afterStart.slice(0, end);

    return body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [company, ticker, sector, year, revenue, netIncome, operatingIncome, grossProfit] =
          line.split('\t');

        return {
          company,
          ticker,
          sector,
          year: Number(year),
          revenue: toNullable(revenue),
          net_income: toNullable(netIncome),
          operating_income: toNullable(operatingIncome),
          gross_profit: toNullable(grossProfit),
        };
      });
  }
}

function toNullable(value: string): string | null {
  return value === NULL_MARKER ? null : value;
}
