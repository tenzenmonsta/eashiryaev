import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

type SurfaceGrid = {
  x: number[][];
  y: number[][];
  z: Array<Array<number | null>>;
};

type SurfacePoints = {
  x: number[];
  y: number[];
  z: number[];
};

type SurfaceAnalytics = {
  skew: SurfaceGrid;
  term_structure: SurfaceGrid;
  curvature: SurfaceGrid;
};

type TimelineFrame = {
  expiry: string;
  included_expiries: number;
  surface: SurfaceGrid;
  points: SurfacePoints;
  analytics: SurfaceAnalytics;
};

type SmileSeries = {
  x: number[];
  y: number[];
};

type SurfaceResponse = {
  symbol: string;
  surface: SurfaceGrid;
  points: SurfacePoints;
  analytics: SurfaceAnalytics;
  timeline: {
    expiries: string[];
    frames: TimelineFrame[];
  };
  smiles: Record<
    string,
    {
      calls: SmileSeries;
      puts: SmileSeries;
    }
  >;
  meta?: {
    rows?: number;
    expiries?: number;
    grid_size?: number;
    smile_rows?: number;
  };
};

type PlotlyLike = {
  newPlot: (
    root: HTMLDivElement,
    data: object[],
    layout: object,
    config: object
  ) => Promise<unknown> | unknown;
  purge: (root: HTMLDivElement) => void;
};

declare global {
  interface Window {
    Plotly?: PlotlyLike;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_VOL_SURFACE_API ?? "";
const OCEAN_DIVERGING_SCALE: Array<[number, string]> = [
  [0, "#08244b"],
  [0.2, "#0d5c87"],
  [0.4, "#2aa7b8"],
  [0.5, "#d8f3f8"],
  [0.6, "#7fd3d8"],
  [0.8, "#1b7fa8"],
  [1, "#0a2f5a"],
];

function isFiniteNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getUniqueFiniteCount(grid: number[][]): number {
  return new Set(grid.flat().filter((value) => Number.isFinite(value))).size;
}

function canRenderSurfaceGrid(grid: SurfaceGrid): boolean {
  const rowCount = grid.z.length;
  const columnCount = grid.z[0]?.length ?? 0;

  if (rowCount < 2 || columnCount < 2) {
    return false;
  }

  const finiteValues = grid.z.flat().filter(isFiniteNumber);
  if (finiteValues.length < 4) {
    return false;
  }

  return getUniqueFiniteCount(grid.x) >= 2 && getUniqueFiniteCount(grid.y) >= 2;
}

function sanitizeGrid(grid: SurfaceGrid): SurfaceGrid {
  return {
    x: grid.x.map((row) => row.map((value) => (Number.isFinite(value) ? value : 0))),
    y: grid.y.map((row) => row.map((value) => (Number.isFinite(value) ? value : 0))),
    z: grid.z.map((row) => row.map((value) => (isFiniteNumber(value) ? value : null))),
  };
}

function getAbsMax(grid: SurfaceGrid): number {
  const values = grid.z.flat().filter(isFiniteNumber);
  if (!values.length) {
    return 1;
  }

  const absMax = Math.max(...values.map((value) => Math.abs(value)));
  return absMax > 0 ? absMax : 1;
}

function renderSurfaceChart(
  root: HTMLDivElement,
  grid: SurfaceGrid,
  title: string,
  zTitle: string,
  colorscale: string | Array<[number, string]>,
  options?: {
    points?: SurfacePoints;
    symmetric?: boolean;
    height?: number;
  }
) {
  if (!window.Plotly) {
    return;
  }

  const safeGrid = sanitizeGrid(grid);
  const canRenderSurface = canRenderSurfaceGrid(safeGrid);
  const traces: object[] = canRenderSurface
    ? [
        {
          type: "surface",
          x: safeGrid.x,
          y: safeGrid.y,
          z: safeGrid.z,
          colorscale,
          showscale: true,
          opacity: 0.96,
          name: title,
          ...(options?.symmetric
            ? (() => {
                const absMax = getAbsMax(safeGrid);
                return { cmin: -absMax, cmax: absMax };
              })()
            : {}),
        },
      ]
    : [];

  if (options?.points) {
    traces.push({
      type: "scatter3d",
      mode: "markers",
      x: options.points.x,
      y: options.points.y,
      z: options.points.z,
      marker: {
        size: 2,
        color: "#ffffff",
          opacity: 0.42,
      },
      name: canRenderSurface ? "Raw points" : "Available points",
    });
  }

  window.Plotly.newPlot(
    root,
    traces,
    {
      autosize: true,
      height: options?.height ?? 520,
      paper_bgcolor: "#111217",
      plot_bgcolor: "#111217",
      font: { color: "#f2f2f2" },
      margin: { l: 0, r: 0, t: 28, b: 0 },
      title: {
        text: title,
        font: { size: 16 },
      },
      annotations: canRenderSurface
        ? []
        : [
            {
              text: options?.points
                ? "Need at least 2 expiries to render a full 3D surface. Showing the available points for this frame."
                : "Need at least 2 expiries before this 3D derivative surface can be rendered.",
              x: 0.5,
              y: 0.5,
              xref: "paper",
              yref: "paper",
              showarrow: false,
              font: { color: "#d7d7d7", size: 14 },
              align: "center",
            },
          ],
      scene: {
        bgcolor: "#111217",
        xaxis: {
          title: "k_fwd = ln(K/F)",
          color: "#d7d7d7",
          gridcolor: "rgba(255,255,255,0.12)",
          zerolinecolor: "rgba(255,255,255,0.15)",
        },
        yaxis: {
          title: "Time to Expiry T",
          color: "#d7d7d7",
          gridcolor: "rgba(255,255,255,0.12)",
          zerolinecolor: "rgba(255,255,255,0.15)",
        },
        zaxis: {
          title: zTitle,
          color: "#d7d7d7",
          gridcolor: "rgba(255,255,255,0.12)",
          zerolinecolor: "rgba(255,255,255,0.15)",
        },
      },
    },
    { responsive: true, displaylogo: false }
  );
}

export default function VolatilitySurfacePage() {
  const [ticker, setTicker] = useState("SLV");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SurfaceResponse | null>(null);
  const [plotlyReady, setPlotlyReady] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const smileRef = useRef<HTMLDivElement | null>(null);
  const skewRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<HTMLDivElement | null>(null);
  const curvatureRef = useRef<HTMLDivElement | null>(null);

  async function handleBuild() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/surface?symbol=${ticker.toUpperCase()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          typeof json.detail === "string" ? json.detail : "Failed to build surface"
        );
      }

      setData(json);
      setSelectedFrameIndex(Math.max((json.timeline?.frames?.length ?? 1) - 1, 0));
      setIsPlaying(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message === "Failed to fetch"
          ? `Could not reach volatility API at ${API_BASE}. Make sure the FastAPI backend is running.`
          : err instanceof Error
            ? err.message
            : "Unknown error";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const activeFrame = useMemo(() => {
    if (!data?.timeline?.frames?.length) {
      return null;
    }
    return data.timeline.frames[selectedFrameIndex] ?? data.timeline.frames[data.timeline.frames.length - 1];
  }, [data, selectedFrameIndex]);

  const activeExpiry = activeFrame?.expiry ?? null;
  const activeSmile = activeExpiry ? data?.smiles?.[activeExpiry] ?? null : null;
  const frameCount = data?.timeline?.frames?.length ?? 0;

  useEffect(() => {
    if (!isPlaying || frameCount <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setSelectedFrameIndex((current) => {
        if (current >= frameCount - 1) {
          window.clearInterval(timer);
          setIsPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [frameCount, isPlaying]);

  useEffect(() => {
    if (frameCount > 0 && selectedFrameIndex >= frameCount) {
      setSelectedFrameIndex(frameCount - 1);
    }
  }, [frameCount, selectedFrameIndex]);

  useEffect(() => {
    if (!plotlyReady || !surfaceRef.current || !activeFrame || !window.Plotly) {
      return;
    }

    renderSurfaceChart(
      surfaceRef.current,
      activeFrame.surface,
      activeExpiry
        ? `${data?.symbol} Surface Build-Up | last expiry ${activeExpiry}`
        : `${data?.symbol} Surface`,
      "Implied Volatility",
      "Viridis",
      {
        points: activeFrame.points,
        height: 680,
      }
    );

    return () => {
      if (surfaceRef.current && window.Plotly) {
        window.Plotly.purge(surfaceRef.current);
      }
    };
  }, [activeExpiry, activeFrame, data?.symbol, plotlyReady]);

  useEffect(() => {
    if (!plotlyReady || !smileRef.current || !activeSmile || !window.Plotly) {
      return;
    }

    window.Plotly.newPlot(
      smileRef.current,
      [
        {
          type: "scatter",
          mode: "lines+markers",
          x: activeSmile.calls.x,
          y: activeSmile.calls.y,
          name: "Calls",
          line: { color: "#58d68d", width: 2 },
          marker: { size: 6, color: "#58d68d" },
        },
        {
          type: "scatter",
          mode: "lines+markers",
          x: activeSmile.puts.x,
          y: activeSmile.puts.y,
          name: "Puts",
          line: { color: "#5dade2", width: 2 },
          marker: { size: 6, color: "#5dade2" },
        },
      ],
      {
        autosize: true,
        height: 420,
        paper_bgcolor: "#111217",
        plot_bgcolor: "#111217",
        font: { color: "#f2f2f2" },
        margin: { l: 48, r: 20, t: 36, b: 52 },
        title: {
          text: activeExpiry
            ? `${data?.symbol} Volatility Smile | expiry ${activeExpiry}`
            : `${data?.symbol} Volatility Smile`,
          font: { size: 16 },
        },
        xaxis: {
          title: "k_fwd = ln(K/F)",
          color: "#d7d7d7",
          gridcolor: "rgba(255,255,255,0.10)",
          zerolinecolor: "rgba(255,255,255,0.14)",
        },
        yaxis: {
          title: "Implied Volatility",
          color: "#d7d7d7",
          gridcolor: "rgba(255,255,255,0.10)",
          zerolinecolor: "rgba(255,255,255,0.14)",
        },
        legend: {
          orientation: "h",
          yanchor: "bottom",
          y: 1.02,
          xanchor: "right",
          x: 1,
        },
      },
      { responsive: true, displaylogo: false }
    );

    return () => {
      if (smileRef.current && window.Plotly) {
        window.Plotly.purge(smileRef.current);
      }
    };
  }, [activeExpiry, activeSmile, data?.symbol, plotlyReady]);

  useEffect(() => {
    if (!plotlyReady || !activeFrame || !window.Plotly) {
      return;
    }

    const plots = [
      {
        ref: skewRef,
        grid: activeFrame.analytics.skew,
        title: activeExpiry
          ? `${data?.symbol} IV Skew | expiry ${activeExpiry}`
          : `${data?.symbol} IV Skew`,
        zTitle: "∂σ / ∂k_fwd",
      },
      {
        ref: termRef,
        grid: activeFrame.analytics.term_structure,
        title: activeExpiry
          ? `${data?.symbol} IV Term Structure | expiry ${activeExpiry}`
          : `${data?.symbol} IV Term Structure`,
        zTitle: "∂σ / ∂T",
      },
      {
        ref: curvatureRef,
        grid: activeFrame.analytics.curvature,
        title: activeExpiry
          ? `${data?.symbol} IV Curvature | expiry ${activeExpiry}`
          : `${data?.symbol} IV Curvature`,
        zTitle: "∂²σ / ∂k_fwd²",
      },
    ];

    for (const plot of plots) {
      if (!plot.ref.current) {
        continue;
      }

      renderSurfaceChart(
        plot.ref.current,
        plot.grid,
        plot.title,
        plot.zTitle,
        OCEAN_DIVERGING_SCALE,
        { symmetric: true, height: 460 }
      );
    }

    return () => {
      for (const plot of plots) {
        if (plot.ref.current && window.Plotly) {
          window.Plotly.purge(plot.ref.current);
        }
      }
    };
  }, [activeExpiry, activeFrame, data?.symbol, plotlyReady]);

  return (
    <>
      <Head>
        <title>Volatility Surface Builder</title>
        <meta
          name="description"
          content="Interactive forward-normalized implied volatility surface, smile, and derivatives from option chain data."
        />
      </Head>

      <Script
        src="https://cdn.plot.ly/plotly-2.35.2.min.js"
        strategy="afterInteractive"
        onLoad={() => setPlotlyReady(true)}
      />

      <main className="container">
        <div style={{ marginBottom: "1.4rem" }}>
          <Link href="/library" style={{ color: "#bdbdbd" }}>
            Back to Library
          </Link>
        </div>

        <h1 style={{ marginBottom: "0.6rem" }}>Volatility Surface Builder</h1>
        <p style={{ color: "#d7d7d7", lineHeight: 1.65, maxWidth: 920 }}>
          Build and explore the volatility surface for a selected ticker, then step through expiries
          and watch how the shape evolves over time.
        </p>

        <div className="surfaceCard" style={{ marginTop: "1.5rem" }}>
          <div className="surfaceToolbar">
            <div className="surfaceInputWrap">
              <label htmlFor="ticker" className="surfaceLabel">Ticker</label>
              <input
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="SLV"
                className="surfaceInput"
              />
            </div>

            <button onClick={handleBuild} disabled={loading} className="surfaceButton">
              {loading ? "Building..." : "Build Surface"}
            </button>
          </div>

          {error && <div className="surfaceError">{error}</div>}

          {!data && !loading && !error && (
            <div className="surfacePlaceholder">
              Enter a ticker and build the surface. Example: SPY, QQQ, SLV, AAPL.
            </div>
          )}

          {data && (
            <div style={{ marginTop: "1rem" }}>
              <div className="surfaceMetaRow">
                <div className="surfaceMetaChip">
                  <strong>{data.symbol}</strong>
                </div>
                {!!data.meta?.rows && (
                  <div className="surfaceMetaChip">surface rows: {data.meta.rows}</div>
                )}
                {!!data.meta?.expiries && (
                  <div className="surfaceMetaChip">expiries: {data.meta.expiries}</div>
                )}
                {!!data.meta?.smile_rows && (
                  <div className="surfaceMetaChip">smile rows: {data.meta.smile_rows}</div>
                )}
              </div>

              {!!data.timeline?.frames?.length && (
                <div className="surfaceSliderCard">
                  <div className="surfaceSliderHeader">
                    <div>
                      <div className="surfaceSliderTitle">Surface Through Time</div>
                      <div className="surfaceSliderHint">
                        Drag the slider to add expiries one by one and watch the surface evolve.
                      </div>
                    </div>
                    <div className="surfaceSliderActions">
                      <button
                        type="button"
                        className="surfaceButton surfaceButtonSecondary"
                        disabled={frameCount <= 1}
                        onClick={() => {
                          if (!isPlaying && selectedFrameIndex >= frameCount - 1) {
                            setSelectedFrameIndex(0);
                          }
                          setIsPlaying((current) => !current);
                        }}
                      >
                        {isPlaying ? "Pause" : "Play"}
                      </button>
                      <div className="surfaceSliderValue">
                        {activeExpiry ? `Last included expiry: ${activeExpiry}` : "No expiry selected"}
                      </div>
                    </div>
                  </div>

                  <input
                    className="surfaceRange"
                    type="range"
                    min={0}
                    max={Math.max(data.timeline.frames.length - 1, 0)}
                    step={1}
                    value={selectedFrameIndex}
                    onChange={(event) => {
                      setIsPlaying(false);
                      setSelectedFrameIndex(Number(event.target.value));
                    }}
                  />

                  <div className="surfaceSliderScale">
                    <span>{data.timeline.expiries[0]}</span>
                    <span>{data.timeline.expiries[data.timeline.expiries.length - 1]}</span>
                  </div>
                </div>
              )}

              {!plotlyReady && <div className="surfacePlaceholder">Loading Plotly...</div>}

              <div className="surfaceCharts">
                <div className="surfaceChartPanel">
                  <div
                    ref={surfaceRef}
                    style={{
                      display: plotlyReady ? "block" : "none",
                      width: "100%",
                      minHeight: "680px",
                    }}
                  />
                </div>

                <div className="surfaceChartPanel">
                  <div
                    ref={smileRef}
                    style={{
                      display: plotlyReady ? "block" : "none",
                      width: "100%",
                      minHeight: "420px",
                    }}
                  />
                </div>
              </div>

              <div className="surfaceSectionBlock">
                <div className="surfaceSectionTitle">Surface Derivatives</div>
                <div className="surfaceSectionHint">
                  Additional charts showing how the volatility surface changes across strike and time.
                </div>
              </div>

              <div className="surfaceDerivativesGrid">
                <div className="surfaceChartPanel">
                  <div
                    ref={skewRef}
                    style={{
                      display: plotlyReady ? "block" : "none",
                      width: "100%",
                      minHeight: "460px",
                    }}
                  />
                </div>

                <div className="surfaceChartPanel">
                  <div
                    ref={termRef}
                    style={{
                      display: plotlyReady ? "block" : "none",
                      width: "100%",
                      minHeight: "460px",
                    }}
                  />
                </div>

                <div className="surfaceChartPanel">
                  <div
                    ref={curvatureRef}
                    style={{
                      display: plotlyReady ? "block" : "none",
                      width: "100%",
                      minHeight: "460px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
