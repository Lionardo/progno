"use client";

import { useEffect, useRef } from "react";
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

export function MarketHistoryChart({
  className,
  compact = false,
  history,
}: MarketHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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
      height: compact ? 150 : 280,
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
      },
      timeScale: {
        borderColor: "rgba(244, 238, 219, 0.08)",
        secondsVisible: false,
        timeVisible: true,
      },
    });

    const passSeries = chart.addSeries(LineSeries, {
      color: "#45d7c0",
      lineWidth: 3,
      priceLineVisible: false,
      title: "If passes",
    });
    const failSeries = chart.addSeries(LineSeries, {
      color: "#f2c66d",
      lineWidth: 3,
      priceLineVisible: false,
      title: "If fails",
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

    return () => {
      chart.remove();
    };
  }, [compact, history]);

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
      <div ref={containerRef} />
    </div>
  );
}
