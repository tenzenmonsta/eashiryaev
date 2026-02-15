import React, { useEffect, useMemo, useRef, useState } from "react";

type Params = {
  s0?: number;      // initial price
  mu?: number;      // drift
  sigma?: number;   // volatility
  steps?: number;   // time steps
  paths?: number;   // number of simulated paths
};

function simulateGBM({ s0, mu, sigma, steps, paths }: Required<Params>) {
  // Simple Box-Muller normal generator
  const randn = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const dt = 1 / steps;
  const out: number[][] = [];

  for (let p = 0; p < paths; p++) {
    const series: number[] = new Array(steps + 1);
    series[0] = s0;

    for (let t = 1; t <= steps; t++) {
      const z = randn();
      const prev = series[t - 1];
      const next =
        prev *
        Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * z);
      series[t] = next;
    }
    out.push(series);
  }
  return out;
}

export default function PriceTrajectories(props: Params) {
  const { s0, mu, sigma, steps, paths } = {
    s0: props.s0 ?? 100,
    mu: props.mu ?? 0.10,
    sigma: props.sigma ?? 0.35,
    steps: props.steps ?? 180,
    paths: props.paths ?? 24,
  };

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [seed, setSeed] = useState(0);

  // re-simulate on seed/params
  const series = useMemo(() => {
    // use seed to force re-render; not true seeded RNG, but enough for now
    void seed;
    return simulateGBM({ s0, mu, sigma, steps, paths });
  }, [s0, mu, sigma, steps, paths, seed]);

  // derive min/max for scaling
  const { minY, maxY } = useMemo(() => {
    let mn = Infinity, mx = -Infinity;
    for (const path of series) {
      for (const v of path) {
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
    }
    // pad a bit
    const pad = (mx - mn) * 0.08 || 1;
    return { minY: mn - pad, maxY: mx + pad };
  }, [series]);

  const width = 720;
  const height = 420;
  const pad = 18;

  const x = (t: number) => pad + (t / steps) * (width - 2 * pad);
  const y = (v: number) =>
    pad + (1 - (v - minY) / (maxY - minY)) * (height - 2 * pad);

  const pathsD = series.map((path) => {
    let d = `M ${x(0)} ${y(path[0])}`;
    for (let t = 1; t <= steps; t++) d += ` L ${x(t)} ${y(path[t])}`;
    return d;
  });

  // auto-refresh every few seconds for “alive” effect
  useEffect(() => {
    const id = window.setInterval(() => setSeed((s) => s + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="card">
      
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ marginTop: 10, display: "block" }}
      >
        {/* grid */}
        <g opacity={0.25}>
          {Array.from({ length: 6 }).map((_, i) => {
            const yy = pad + (i / 5) * (height - 2 * pad);
            return <line key={i} x1={pad} x2={width - pad} y1={yy} y2={yy} stroke="white" strokeWidth="1" />;
          })}
        </g>

        {/* paths */}
        <g fill="none">
          {pathsD.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="white"
              strokeOpacity={0.22}
              strokeWidth={0.55}
            />
          ))}
          {/* highlight one path */}
          <path
            d={pathsD[0]}
            stroke="white"
            strokeOpacity={0.55}
            strokeWidth={2}
          />
        </g>
      </svg>
    </div>
  );
}
