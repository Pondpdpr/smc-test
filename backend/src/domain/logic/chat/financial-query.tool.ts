import { sql } from 'kysely';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import { MainDb } from '@/infra/db/db.main';

export const FINANCIAL_QUERY_TOOL_NAME = 'query_financial_data';

// The one tool the model may call. Args are structured (not raw SQL) so the query is
// always a bounded SELECT - the model never writes SQL; we build it and render it to the user.
export const financialQueryTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: FINANCIAL_QUERY_TOOL_NAME,
    description:
      'Query revenue and income data for US public companies. Covers exactly 48 companies, 2022-2025. If a requested company/year/sector is outside that coverage, this returns zero rows - that means the data is not available and must be reported as such, never estimated or guessed. To rank or compare ACROSS companies (e.g. "which company had the biggest growth"), omit the companies filter to get the full dataset - do not call this once per company you already know the name of, since that silently excludes the rest of the dataset from the comparison.',
    parameters: {
      type: 'object',
      properties: {
        companies: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Company names or ticker symbols, e.g. ["Apple", "AAPL", "Bank of America"]. Matching is fuzzy (case/punctuation-insensitive). Omit entirely (do not guess a shortlist) when the question compares/ranks across companies - only set this when the user named specific companies.',
        },
        years: {
          type: 'array',
          items: { type: 'integer' },
          description:
            'Fiscal years, e.g. [2022, 2023]. Omit to not filter by year.',
        },
        sectors: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Sectors, e.g. ["Technology"]. Omit to not filter by sector.',
        },
      },
    },
  },
};

export type FinancialQueryArgs = {
  companies?: string[];
  years?: number[];
  sectors?: string[];
};

// Postgres-side normalization so "Bank of America" matches stored "BankOfAmerica" -
// both sides get lowercased and stripped to alphanumerics before comparing.
function normalizedColumn(column: string) {
  return sql<string>`regexp_replace(lower(${sql.ref(column)}), '[^a-z0-9]', '', 'g')`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildFinancialQuery(db: MainDb, args: FinancialQueryArgs) {
  return db.read
    .selectFrom('financial_data')
    .select([
      'company',
      'ticker',
      'sector',
      'year',
      'revenue',
      'gross_profit',
      'operating_income',
      'net_income',
    ])
    .$if(!!args.companies?.length, (qb) =>
      qb.where((eb) =>
        eb.or(
          args.companies!.flatMap((company) => {
            const needle = normalize(company);
            return [
              eb(
                normalizedColumn('financial_data.company'),
                'like',
                `%${needle}%`,
              ),
              eb(sql<string>`lower(financial_data.ticker)`, '=', needle),
            ];
          }),
        ),
      ),
    )
    .$if(!!args.years?.length, (qb) => qb.where('year', 'in', args.years!))
    .$if(!!args.sectors?.length, (qb) =>
      qb.where((eb) =>
        eb.or(args.sectors!.map((sector) => eb('sector', 'ilike', sector))),
      ),
    )
    .orderBy('company')
    .orderBy('year');
}

// Split from execution so the caller can render/emit the SQL text (the
// "visibly rendered" tool call) BEFORE the query actually runs, not after.
export function renderFinancialQuerySql(
  db: MainDb,
  args: FinancialQueryArgs,
): string {
  const compiled = buildFinancialQuery(db, args).compile();
  return renderCompiledSql(compiled.sql, compiled.parameters);
}

export async function executeFinancialQuery(
  db: MainDb,
  args: FinancialQueryArgs,
): Promise<Record<string, unknown>[]> {
  return buildFinancialQuery(db, args).execute();
}

// Inlines compiled query parameters back into the SQL text purely for
// display in the "visibly rendered" tool call - never re-executed.
function renderCompiledSql(
  sqlText: string,
  parameters: readonly unknown[],
): string {
  let i = 0;
  return sqlText.replace(/\$\d+/g, () => {
    const value = parameters[i++];
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    return String(value);
  });
}
