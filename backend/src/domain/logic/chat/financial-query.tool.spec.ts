import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';

import type { DB } from '@/infra/db/db';
import type { MainDb } from '@/infra/db/db.main';

import { renderFinancialQuerySql } from './financial-query.tool';

// .compile() is pure SQL generation - it never opens a connection - so a
// real Kysely instance pointed at a bogus connection string is enough here,
// no live Postgres (or the full Nest DI graph MainDb normally comes from)
// needed.
const kysely = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: 'postgresql://unused/unused' }),
  }),
});
const db = { read: kysely } as unknown as MainDb;

describe('renderFinancialQuerySql', () => {
  it('selects every column with no filters and no WHERE clause', () => {
    const sqlText = renderFinancialQuerySql(db, {});

    expect(sqlText).toContain('select "company", "ticker", "sector", "year"');
    expect(sqlText).toContain(
      '"revenue", "gross_profit", "operating_income", "net_income"',
    );
    expect(sqlText).not.toContain('where');
    expect(sqlText).toContain('order by "company", "year"');
  });

  it('filters by company name, normalized to match fuzzy/punctuation-insensitive storage', () => {
    const sqlText = renderFinancialQuerySql(db, {
      companies: ['Bank of America'],
    });

    // "Bank of America" -> "bankofamerica" (lowercased, stripped of spaces).
    expect(sqlText).toContain(
      "regexp_replace(lower(\"financial_data\".\"company\"), '[^a-z0-9]', '', 'g') like '%bankofamerica%'",
    );
    expect(sqlText).toContain("lower(financial_data.ticker) = 'bankofamerica'");
  });

  it('matches a ticker symbol the same way it matches a company name', () => {
    const sqlText = renderFinancialQuerySql(db, { companies: ['AAPL'] });

    expect(sqlText).toContain("lower(financial_data.ticker) = 'aapl'");
  });

  it('filters by year with an IN clause', () => {
    const sqlText = renderFinancialQuerySql(db, { years: [2022, 2023] });

    expect(sqlText).toContain('where "year" in (2022, 2023)');
  });

  it('filters by sector with a case-insensitive match', () => {
    const sqlText = renderFinancialQuerySql(db, { sectors: ['Technology'] });

    expect(sqlText).toContain('"sector" ilike \'Technology\'');
  });

  it('combines companies, years, and sectors as ANDed conditions', () => {
    const sqlText = renderFinancialQuerySql(db, {
      companies: ['Apple'],
      years: [2023],
      sectors: ['Technology'],
    });

    expect(sqlText).toContain("'%apple%'");
    expect(sqlText).toContain('"year" in (2023)');
    expect(sqlText).toContain("ilike 'Technology'");
  });

  it('treats empty filter arrays the same as omitted filters', () => {
    const sqlText = renderFinancialQuerySql(db, {
      companies: [],
      years: [],
      sectors: [],
    });

    expect(sqlText).not.toContain('where');
  });

  it('escapes single quotes in the rendered (display-only) SQL', () => {
    const sqlText = renderFinancialQuerySql(db, {
      sectors: ["O'Brien Sector"],
    });

    expect(sqlText).toContain("ilike 'O''Brien Sector'");
  });

  it('matches multiple companies with OR', () => {
    const sqlText = renderFinancialQuerySql(db, {
      companies: ['Apple', 'Microsoft'],
    });

    expect(sqlText).toContain("'%apple%'");
    expect(sqlText).toContain("'%microsoft%'");
    expect(sqlText).toMatch(/or/i);
  });
});
