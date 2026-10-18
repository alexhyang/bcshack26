import { scenarioPending } from "./scenario";
import type { MarketDataProvider } from "@/data/market-provider";
import { marketProvider } from "@/data/simulated-provider";
import type { DaySummary, GameResult, GameState } from "@/types/game";
import { holdOvernight } from "./inventory";
import { round } from "./trading";

import { advancePricing, enableDynamicPricing } from "@/features/pricing/market";
import { DEFAULT_MARKET_SEED } from "@/features/pricing/config";

export function createInitialState(
  provider: MarketDataProvider = marketProvider,
  options: { seed?: number; dynamicPricing?: boolean; harvest?: GameState["harvest"] } = {},
): GameState {
  const initial: GameState = {
    ...(options.harvest ? { harvest: options.harvest } : {}),
    scenarioId: provider.scenarioId,
    day: 1,
    inventory: options.harvest?.initialInventory ?? provider.crop.initialInventory,
    freshness: 100,
    cash: 0,
    grossRevenue: 0,
    sellingCosts: 0,
    storageCosts: 0,
    spoiled: 0,
    transactions: [],
    summaries: [],
    completed: false,
  };
  return options.dynamicPricing === false
    ? initial
    : enableDynamicPricing(initial, options.seed ?? DEFAULT_MARKET_SEED, 0, provider);
}

export function advanceDay(
  state: GameState,
  provider: MarketDataProvider = marketProvider,
): GameResult {
  if (scenarioPending(state))
    return { ok: false, error: "Choose today’s scenario before advancing." };
  if (state.completed) return { ok: false, error: "This season is already complete." };
  const today = provider.getDay(state.day);
  const trades = state.transactions.filter((t) => t.day === state.day);
  const sold = round(trades.reduce((sum, t) => sum + t.quantity, 0));
  const netReturn = round(trades.reduce((sum, t) => sum + t.netReturn, 0));
  const finalDay = state.day === provider.duration;
  const overnight = finalDay
    ? { inventory: state.inventory, freshness: state.freshness, spoiled: 0, storageCosts: 0 }
    : holdOvernight(state.inventory, state.freshness, today);
  let feedback: string;
  if (finalDay)
    feedback =
      state.inventory > 0
        ? `The season closed with ${state.inventory} kg unsold. Unsold inventory has no salvage value in this simulation.`
        : "Every saleable kilogram found a buyer. Compare your selling margin with the Day 1 baseline.";
  else if (state.inventory === 0)
    feedback = `You sold ${sold} kg today and have no stock left to store. You avoided further holding costs and spoilage.`;
  else
    feedback = `You held ${state.inventory} kg overnight. Storage cost $${overnight.storageCosts.toFixed(2)} and ${overnight.spoiled} kg spoiled. Future price gains must cover both costs to make waiting worthwhile.`;
  const summary: DaySummary = {
    day: state.day,
    sold,
    held: state.inventory,
    spoiled: overnight.spoiled,
    storageCosts: overnight.storageCosts,
    netReturn,
    feedback,
  };
  return {
    ok: true,
    state: {
      ...state,
      day: finalDay ? state.day : state.day + 1,
      completed: finalDay,
      inventory: overnight.inventory,
      freshness: overnight.freshness,
      storageCosts: round(state.storageCosts + overnight.storageCosts),
      cash: round(state.cash - overnight.storageCosts),
      spoiled: round(state.spoiled + overnight.spoiled),
      summaries: [...state.summaries, summary],
      ...(state.pricing && !finalDay
        ? { pricing: advancePricing(state.pricing, state.day + 1, overnight.freshness, provider) }
        : {}),
    },
  };
}
