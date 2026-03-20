"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  LineSeries,
  type UTCTimestamp,
  createChart,
} from "lightweight-charts";

import type { MarketHistoryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MarketHistoryChartProps {
  className?: string;
  compact?: boolean;
  history: MarketHistoryPoint[];
}

interface BadgePositions {
  failTop: number;
  passTop: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function separateBadgePositions(
  passTop: number,
  failTop: number,
  height: number,
): BadgePositions {
  const minimumGap = 42;
  let adjustedPassTop = passTop;
  let adjustedFailTop = failTop;

  if (Math.abs(adjustedPassTop - adjustedFailTop) < minimumGap) {
    if (adjustedPassTop <= adjustedFailTop) {
      adjustedPassTop -= minimumGap / 2;
      adjustedFailTop += minimumGap / 2;
    } else {
      adjustedPassTop += minimumGap / 2;
      adjustedFailTop -= minimumGap / 2;
    }
  }

  return {
    failTop: clamp(adjustedFailTop, 20, height - 20),
    passTop: clamp(adjustedPassTop, 20, height - 20),
  };
}

export function MarketHistoryChart({
  className,
  compact = false,
  history,
}: MarketHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [badgePositions, setBadgePositions] = useState<BadgePositions | null>(
    null,
  );
  const latestPoint = history.at(-1) ?? null;

  useEffect(() => {
    if (!containerRef.current || history.length === 0) {
      return;
    }

    const chart = createChart(containerRef.current, {
      autoSize: true,
      crosshair: {
        horzLine: {
          color: "rgba(244, 238, 219, 0.12)",
        },
        vertLine: {
          color: "rgba(244, 238, 219, 0.18)",
        },
      },
      grid: {
        horzLines: {
          color: "rgba(244, 238, 219, 0.08)",
        },
        vertLines: {
          color: "rgba(244, 238, 219, 0.04)",
        },
      },
      height: compact ? 150 : 360,
      layout: {
        background: {
          color: "transparent",
          type: ColorType.Solid,
        },
        fontFamily: "var(--font-space-grotesk)",
        textColor: "rgba(244, 238, 219, 0.72)",
      },
      localization: {
        priceFormatter: (value: number) => value.toFixed(1),
      },
      rightPriceScale: {
        borderColor: "rgba(244, 238, 219, 0.08)",
        minimumWidth: compact ? 44 : 64,
      },
      timeScale: {
        borderColor: "rgba(244, 238, 219, 0.08)",
        secondsVisible: false,
        timeVisible: true,
      },
    });

    const passSeries = chart.addSeries(LineSeries, {
      color: "#45d7c0",
      lastValueVisible: false,
      lineWidth: 3,
      priceLineVisible: false,
    });
    const failSeries = chart.addSeries(LineSeries, {
      color: "#f2c66d",
      lastValueVisible: false,
      lineWidth: 3,
      priceLineVisible: false,
    });

    passSeries.setData(
      history.map((point) => ({
        time: point.time as UTCTimestamp,
        value: point.passAverage,
      })),
    );
    failSeries.setData(
      history.map((point) => ({
        time: point.time as UTCTimestamp,
        value: point.failAverage,
      })),
    );

    chart.timeScale().fitContent();

    const updateBadgePositions = () => {
      if (!containerRef.current || compact) {
        setBadgePositions(null);
        return;
      }

      const passTop = passSeries.priceToCoordinate(
        latestPoint?.passAverage ?? NaN,
      );
      const failTop = failSeries.priceToCoordinate(
        latestPoint?.failAverage ?? NaN,
      );

      if (passTop === null || failTop === null) {
        setBadgePositions(null);
        return;
      }

      setBadgePositions(
        separateBadgePositions(
          passTop,
          failTop,
          containerRef.current.clientHeight,
        ),
      );
    };

    chart.timeScale().subscribeSizeChange(updateBadgePositions);
    updateBadgePositions();

    return () => {
      chart.timeScale().unsubscribeSizeChange(updateBadgePositions);
      chart.remove();
    };
  }, [compact, history, latestPoint?.failAverage, latestPoint?.passAverage]);

  if (history.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-40 items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] px-4 text-center text-sm text-[color:var(--color-muted)]",
          className,
        )}
      >
        No market history yet. The first forecast revision will start the chart.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-white/8 bg-[color:rgba(9,15,23,0.56)] p-3",
        className,
      )}
    >
      <div className="relative">
        <div ref={containerRef} />
        {!compact && badgePositions && latestPoint ? (
          <div className="pointer-events-none absolute inset-0">
            <SeriesBadge
              colorClassName="border-[#45d7c0]/25 bg-[#45d7c0] text-[color:var(--color-obsidian)]"
              label="If passes"
              style={{ right: "5.5rem", top: `${badgePositions.passTop}px` }}
              value={latestPoint.passAverage}
            />
            <SeriesBadge
              colorClassName="border-[#f2c66d]/25 bg-[#f2c66d] text-[color:var(--color-obsidian)]"
              label="If fails"
              style={{ right: "5.5rem", top: `${badgePositions.failTop}px` }}
              value={latestPoint.failAverage}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SeriesBadge({
  colorClassName,
  label,
  style,
  value,
}: {
  colorClassName: string;
  label: string;
  style: { right: string; top: string };
  value: number;
}) {
  return (
    <div
      className={cn(
        "absolute z-10 flex -translate-y-1/2 items-center overflow-hidden rounded-lg border text-sm shadow-[0_10px_25px_rgba(0,0,0,0.18)]",
        colorClassName,
      )}
      style={style}
    >
      <span className="px-3 py-2">{label}</span>
      <span className="border-l border-black/15 px-3 py-2 font-medium">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
