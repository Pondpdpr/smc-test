import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Fixed order, never cycled - the CVD-safety guarantee is the order itself (see index.css).
const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

export type ChartSpec = {
  type: 'bar' | 'line';
  xKey: string;
  xLabel?: string;
  yLabel?: string;
  series: { key: string; label: string }[];
  data: Record<string, string | number>[];
};

// The declared series `key` sometimes doesn't match the row property name - remap
// positionally when the counts line up, else refuse rather than render an empty chart.
export function normalizeChartSpec(spec: ChartSpec): ChartSpec | null {
  if (!spec.data.length) return null;
  const firstRow = spec.data[0];
  const rowKeys = Object.keys(firstRow).filter((k) => k !== spec.xKey);
  const hasAllKeys = spec.series.every((s) => rowKeys.includes(s.key));
  if (hasAllKeys) return spec;
  if (rowKeys.length !== spec.series.length) return null;

  const data = spec.data.map((row) => {
    const keys = Object.keys(row).filter((k) => k !== spec.xKey);
    const remapped: Record<string, string | number> = { [spec.xKey]: row[spec.xKey] };
    spec.series.forEach((s, i) => {
      remapped[s.key] = row[keys[i]];
    });
    return remapped;
  });
  return { ...spec, data };
}

// The model occasionally mistypes a figure copying it into the chart JSON - every
// plotted number must be traceable to the real tool result, or the chart is rejected.
export function isChartDataGrounded(spec: ChartSpec, validNumbers: Set<number>): boolean {
  if (validNumbers.size === 0) return true;
  return spec.data.every((row) =>
    spec.series.every((s) => {
      const value = row[s.key];
      return typeof value !== 'number' || validNumbers.has(value);
    }),
  );
}

function formatCompactUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{formatCompactUsd(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// Rendered from a ```chart fenced code block (see MessageBubble.tsx) - a
// visualization of the same tool results, never a second source of truth.
export function FinancialChart({ spec }: { spec: ChartSpec }) {
  const { type, xKey, xLabel, yLabel, series, data } = spec;
  const Chart = type === 'line' ? LineChart : BarChart;

  return (
    <div className="my-2 rounded-lg border bg-card p-3">
      <ResponsiveContainer width="100%" height={280}>
        <Chart
          data={data}
          margin={{
            top: series.length > 1 ? 4 : 8,
            right: 12,
            left: yLabel ? 16 : 4,
            bottom: xLabel ? 20 : 4,
          }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -12, fill: 'var(--muted-foreground)', fontSize: 12 } : undefined}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatCompactUsd(value)}
            width={64}
            // dx pulls the rotated title clear of the tick numbers.
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: 'insideLeft', dx: -16, fill: 'var(--muted-foreground)', fontSize: 12 }
                : undefined
            }
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
          {series.length > 1 && (
            // top-aligned to avoid colliding with a bottom xLabel.
            <Legend
              verticalAlign="top"
              height={28}
              wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)' }}
              iconType="circle"
              iconSize={8}
            />
          )}
          {series.map((s, i) =>
            type === 'line' ? (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
                isAnimationActive={false}
              />
            ) : (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            ),
          )}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}
