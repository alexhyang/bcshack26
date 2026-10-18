"use client";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  ComposedChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined, Info } from "lucide-react";
import { getMarketHistory } from "@/features/pricing/market";
import type { GameState } from "@/types/game";
import { HarvestSelector } from "./HarvestSelector";
import { getGameCrop } from "@/data/crops";
import { MarketWatch, CHANNEL_COLORS } from "./MarketWatch";

// A zero quote represents an unavailable buyer, not a market price observation.
const chartPrice = (value: number) => {
  const price = Number(value.toFixed(2));
  return Number.isFinite(price) && price > 0 ? price : null;
};

export function PriceChart({ game }: { game: GameState }) {
  const day = game.day;
  const crop = getGameCrop(game);
  const [range, setRange] = useState("ALL");
  const [visible, setVisible] = useState({ wholesaler: true, retailer: true, restaurant: true });
  const points = useMemo(() => {
    const history = getMarketHistory(game);
    const filtered =
      range === "1D" ? history.slice(-1) : range === "3D" ? history.slice(-3) : history;
    // Intraday observations are illustrative, deterministic and limited to revealed days.
    // Actual orders always execute at the displayed daily offer, never these indicative ticks.
    const drift = [0.94, 0.96, 0.945, 0.985, 0.97, 1.015, 0.99, 1];
    return filtered.flatMap((market) =>
      drift.map((factor, i) => ({
        label: `D${market.day} ${9 + i}:00`,
        day: market.day,
        wholesaler: chartPrice(market.offers[0].price * (factor + (i === 7 ? 0 : 0.018))),
        retailer: chartPrice(
          market.offers[1].price * (factor + (i === 7 ? 0 : i % 2 ? -0.007 : 0.012)),
        ),
        restaurant: chartPrice(market.offers[2].price * factor),
      })),
    );
  }, [game, range]);
  const priceDomain = useMemo<[number, number]>(() => {
    const channels = (["wholesaler", "retailer", "restaurant"] as const).filter(
      (channel) => visible[channel],
    );
    const prices = points
      .flatMap((point) => channels.map((channel) => point[channel]))
      .filter((price): price is number => price !== null);
    if (!prices.length) return [0, 1];
    const minimum = Math.min(...prices);
    const maximum = Math.max(...prices);
    const padding = Math.max((maximum - minimum) * 0.08, 0.01);
    return [Math.max(0, minimum - padding), maximum + padding];
  }, [points, visible]);
  return (
    <section className="panel chart-panel" data-tour="price-chart">
      <div className="panel-heading">
        <div className="flex items-center gap-2">
          <ChartNoAxesCombined size={16} className="text-emerald-400" />
          <h2>Market price action</h2>
        </div>
        <span className="subtle-label">CAD / kg</span>
      </div>
      <div className="chart-toolbar">
        <HarvestSelector key={`${crop.id}-${crop.initialInventory}`} game={game} />
        <div className="range-buttons" aria-label="Chart period">
          {["1D", "3D", "ALL"].map((period) => (
            <button
              key={period}
              onClick={() => setRange(period)}
              aria-pressed={range === period}
              className={range === period ? "selected" : ""}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <MarketWatch game={game} />
      <div
        className="price-chart"
        role="img"
        aria-label={`Simulated ${crop.name.toLowerCase()} prices through day ${day}. Use channel buttons to toggle lines; current prices are listed above.`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={points} margin={{ top: 14, right: 4, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ffffff09" vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={50}
              tick={{ fill: "#657487", fontSize: 10 }}
              tickFormatter={(value: string) =>
                day === 1 || range === "1D" ? value.split(" ")[1] : value.replace(" ", " · ")
              }
              dy={8}
            />
            <YAxis
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#657487", fontSize: 10 }}
              domain={priceDomain}
              allowDataOverflow
              tickFormatter={(value: number) => `$${value.toFixed(2)}`}
              width={54}
            />
            <Tooltip
              filterNull
              contentStyle={{
                background: "#182333",
                border: "1px solid #2a3746",
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: "#cbd5e1", marginBottom: 7 }}
              formatter={(value, name) => [
                `$${Number(value).toFixed(2)} / kg`,
                String(name).charAt(0).toUpperCase() + String(name).slice(1),
              ]}
            />
            {visible.restaurant && (
              <Area
                type="monotone"
                dataKey="restaurant"
                stroke="none"
                fill="url(#priceFill)"
                tooltipType="none"
                baseValue="dataMin"
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
            {(["restaurant", "retailer", "wholesaler"] as const)
              .filter((channel) => visible[channel])
              .map((channel) => (
                <Line
                  key={channel}
                  type="monotone"
                  dataKey={channel}
                  stroke={CHANNEL_COLORS[channel]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 4, strokeWidth: 3, stroke: "#111a27" }}
                  isAnimationActive={false}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <div className="chart-legend">
          {(["wholesaler", "retailer", "restaurant"] as const).map((channel) => (
            <button
              key={channel}
              onClick={() => setVisible((prev) => ({ ...prev, [channel]: !prev[channel] }))}
              aria-pressed={visible[channel]}
              style={{ opacity: visible[channel] ? 1 : 0.4 }}
            >
              <span className="channel-dot" style={{ background: CHANNEL_COLORS[channel] }} />
              {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </button>
          ))}
        </div>
        <span className="subtle-label">SIMULATED</span>
      </div>
      <div className="chart-disclaimer">
        <Info size={11} />
        Illustrative intraday history. Zero-price quotes are omitted; the vertical axis fits visible
        prices. Orders execute at the daily buyer offer.
      </div>
    </section>
  );
}
