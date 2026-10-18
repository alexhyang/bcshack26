import { SCENARIO_EVENTS } from "./scenario";
import { marketProvider } from "@/data/simulated-provider";
import { advanceDay, createInitialState } from "./game";
import { executeSale } from "./trading";
import { enableDynamicPricing } from "@/features/pricing/market";
import { DEFAULT_MARKET_SEED } from "@/features/pricing/config";
import type { BuyerId, GameState } from "@/types/game";
import type { DynamicPricingState } from "@/features/pricing/types";

/** Rebuild market rolls from the seed and replay orders; never trust cached balances. */
export function restoreGame(value: unknown): GameState {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const saved = value as Record<string, unknown>;
  if (
    saved.scenarioId !== marketProvider.scenarioId ||
    !Number.isInteger(saved.day) ||
    (saved.day as number) < 1 ||
    (saved.day as number) > marketProvider.duration ||
    typeof saved.completed !== "boolean" ||
    (saved.completed && saved.day !== marketProvider.duration) ||
    !Array.isArray(saved.transactions) ||
    saved.transactions.length > marketProvider.duration * 3
  )
    return initial;
  const transactions = saved.transactions;
  if (
    transactions.some((trade: unknown) => {
      if (!trade || typeof trade !== "object") return true;
      const t = trade as Record<string, unknown>;
      return (
        !Number.isInteger(t.day) ||
        (t.day as number) < 1 ||
        (t.day as number) > (saved.day as number) ||
        typeof t.buyerId !== "string" ||
        typeof t.quantity !== "number"
      );
    })
  )
    return initial;
  const pricing = saved.pricing as DynamicPricingState | undefined;
  if (
    pricing &&
    ((pricing.version !== 1 && pricing.version !== 2) ||
      (pricing.channelDemandStartedDay !== undefined &&
        (!Number.isInteger(pricing.channelDemandStartedDay) ||
          pricing.channelDemandStartedDay < pricing.startedDay ||
          pricing.channelDemandStartedDay > marketProvider.duration + 1)) ||
      !Number.isInteger(pricing.seed) ||
      pricing.seed < 0 ||
      pricing.seed > 4294967295 ||
      !Number.isInteger(pricing.startedDay) ||
      pricing.startedDay < 1 ||
      pricing.startedDay > (saved.day as number) ||
      !Number.isInteger(pricing.legacyTransactionCount) ||
      pricing.legacyTransactionCount < 0 ||
      pricing.legacyTransactionCount > transactions.length)
  )
    return initial;
  let state = createInitialState(marketProvider, { dynamicPricing: false });
  let index = 0;
  if (saved.dailyScenarios !== undefined) {
    if (
      !saved.dailyScenarios ||
      typeof saved.dailyScenarios !== "object" ||
      Array.isArray(saved.dailyScenarios)
    )
      return initial;
    const hands = saved.dailyScenarios as NonNullable<GameState["dailyScenarios"]>;
    for (const [key, hand] of Object.entries(hands)) {
      const day = Number(key);
      if (
        !Number.isInteger(day) ||
        day < 1 ||
        day > (saved.day as number) ||
        !hand ||
        !Array.isArray(hand.cards) ||
        hand.cards.length !== 3 ||
        new Set(hand.cards.filter((id) => id !== "peaceful")).size !==
          hand.cards.filter((id) => id !== "peaceful").length ||
        (hand.selectedIndex !== undefined &&
          (!Number.isInteger(hand.selectedIndex) ||
            hand.selectedIndex < 0 ||
            hand.selectedIndex > 2 ||
            hand.selected === undefined ||
            hand.cards[hand.selectedIndex] !== hand.selected)) ||
        hand.cards.some((id) => !SCENARIO_EVENTS.some((e) => e.id === id)) ||
        (hand.selected !== undefined && !hand.cards.includes(hand.selected)) ||
        ((day < (saved.day as number) || saved.completed) && !hand.selected)
      )
        return initial;
    }
    state = { ...state, dailyScenarios: hands };
  }

  for (let day = 1; day <= (saved.day as number); day++) {
    if (pricing && day === pricing.startedDay)
      state = enableDynamicPricing(
        state,
        pricing.seed,
        pricing.legacyTransactionCount,
        marketProvider,
        { version: pricing.version, startedDay: pricing.channelDemandStartedDay },
      );
    for (const t of transactions.filter((trade) => trade.day === day)) {
      const legacy = !pricing || index < pricing.legacyTransactionCount;
      if (
        pricing &&
        ((legacy && day > pricing.startedDay) || (!legacy && day < pricing.startedDay))
      )
        return initial;
      const preservedPricing = state.pricing;
      const legacyState = { ...state };
      delete legacyState.pricing;
      const result = executeSale(
        legacy ? legacyState : state,
        marketProvider.getDay(day),
        t.buyerId as BuyerId,
        t.quantity,
      );
      if (!result.ok) return initial;
      state = { ...result.state, ...(preservedPricing ? { pricing: preservedPricing } : {}) };
      index++;
    }
    if (day < (saved.day as number) || saved.completed) {
      const result = advanceDay(state);
      if (!result.ok) return initial;
      state = result.state;
    }
  }
  if (state.pricing?.version === 1) {
    state = {
      ...state,
      pricing: { ...state.pricing, version: 2, channelDemandStartedDay: state.day + 1 },
    };
  }
  return pricing
    ? state
    : enableDynamicPricing(state, DEFAULT_MARKET_SEED + state.day, transactions.length);
}
