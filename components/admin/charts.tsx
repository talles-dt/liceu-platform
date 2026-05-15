type LineChartProps = {
  data: number[];
  width?: number;
  height?: number;
};

export function LineChart({ data, width = 920, height = 160 }: LineChartProps) {
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const pad = 10;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / Math.max(1, data.length - 1)) * innerW;
      const y = pad + (1 - (v - min) / range) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[160px] w-full"
      role="img"
      aria-label="Daily activity line chart"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="transparent"
      />
      <line
        x1={pad}
        y1={height - pad}
        x2={width - pad}
        y2={height - pad}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <polyline
        fill="none"
        stroke="rgba(198,169,107,0.70)"
        strokeWidth="1.5"
        points={points}
      />
      {data.map((v, i) => {
        const x = pad + (i / Math.max(1, data.length - 1)) * innerW;
        const y = pad + (1 - (v - min) / range) * innerH;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.6"
            fill="rgba(234,234,234,0.75)"
          />
        );
      })}
    </svg>
  );
}

type BarChartProps = {
  labels: string[];
  values: number[];
};

export function BarChart({ labels, values }: BarChartProps) {
  const max = Math.max(1, ...values);
  return (
    <div className="space-y-2">
      {labels.map((label, idx) => {
        const v = values[idx] ?? 0;
        const w = `${Math.round((v / max) * 100)}%`;
        return (
          <div key={label} className="grid grid-cols-[140px_1fr_60px] gap-3">
            <div className="truncate font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
              {label}
            </div>
            <div className="h-4 border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)]">
              <div
                className="h-full bg-[var(--liceu-secondary)]/35"
                style={{ width: w }}
              />
            </div>
            <div className="text-right font-[var(--font-space-grotesk)] text-[11px] tabular-nums text-[var(--liceu-text)]">
              {v}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type HeatmapProps = {
  rows: string[];
  cols: string[];
  values: number[][]; // 0..1
};

export function Heatmap({ rows, cols, values }: HeatmapProps) {
  return (
    <div className="overflow-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[160px_1fr] gap-3">
          <div />
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
          >
            {cols.map((c) => (
              <div
                key={c}
                className="truncate text-center font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.16em] text-[var(--liceu-muted)]"
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {rows.map((r, ri) => (
            <div key={r} className="grid grid-cols-[160px_1fr] gap-3">
              <div className="truncate font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                {r}
              </div>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`,
                }}
              >
                {cols.map((c, ci) => {
                  const v = Math.max(0, Math.min(1, values?.[ri]?.[ci] ?? 0));
                  const alpha = 0.08 + v * 0.55;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="h-5 border border-[var(--liceu-stone)]"
                      style={{
                        backgroundColor: `rgba(198,169,107,${alpha})`,
                      }}
                      title={`${r} / ${c}: ${Math.round(v * 100)}%`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

