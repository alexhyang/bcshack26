import { describe, expect, it } from "vitest";

import { createInitialState, advanceDay } from "@/engine/game";

import { executeSale } from "@/engine/trading";

import { restoreGame } from "@/engine/saves";

import { marketProvider } from "@/data/simulated-provider";

import {
  chooseScenario,
  dealScenarios,
  getScenario,
  prepareScenario,
  scenarioMarket,
} from "@/engine/scenario";

import type { GameState } from "@/types/game";

const dealt = (): GameState => ({
  ...createInitialState(),
  dailyScenarios: { 1: { cards: ["holiday", "strike", "frost"] } },
});

function select(index: number) {
  const result = chooseScenario(dealt(), index);

  if (!result.ok) throw Error(result.error);

  return result.state;
}

describe("daily scenarios", () => {
  it("deals three distinct cards and keeps a hand stable", () => {
    expect(new Set(dealScenarios(() => 0)).size).toBe(3);

    const state = prepareScenario(createInitialState());

    expect(prepareScenario(state)).toBe(state);

    expect(restoreGame(state)).toEqual(state);
  });

  it("requires a choice before trading or advancing and locks it afterward", () => {
    expect(executeSale(dealt(), marketProvider.getDay(1), "retailer", 10).ok).toBe(false);

    expect(advanceDay(dealt()).ok).toBe(false);

    expect(chooseScenario(select(0), 1).ok).toBe(false);

    expect(chooseScenario(dealt(), -1).ok).toBe(false);

    expect(chooseScenario(dealt(), 3).ok).toBe(false);
  });

  it.each([
    [0, "restaurant"],
    [1, "wholesaler"],
  ] as const)("closes the appropriate buyer for card %s", (index, buyer) => {
    const state = select(index);

    const market = scenarioMarket(state, marketProvider.getDay(1));

    expect(market.offers.find((o) => o.id === buyer)?.capacity).toBe(0);

    expect(executeSale(state, market, buyer, 10).ok).toBe(false);
  });

  it("uses adjusted prices for revenue and replays the same price after reload", () => {
    const state = select(2);

    const base = marketProvider.getDay(1);

    const adjusted = scenarioMarket(state, base);

    expect(adjusted.offers[0].price).toBe(Math.round(base.offers[0].price * 1.25 * 100) / 100);

    const result = executeSale(state, adjusted, "wholesaler", 100);

    if (!result.ok) throw Error(result.error);

    expect(result.state.transactions[0].grossRevenue).toBe(adjusted.offers[0].price * 100);

    expect(restoreGame(JSON.parse(JSON.stringify(result.state)))).toEqual(result.state);

    expect(base.offers[0].price).toBe(marketProvider.getDay(1).offers[0].price);

    const next = advanceDay(result.state);

    if (!next.ok) throw Error(next.error);

    const tomorrow = prepareScenario(next.state);

    expect(getScenario(tomorrow)).toBeUndefined();

    expect(tomorrow.dailyScenarios?.[2].cards).toHaveLength(3);

    expect(scenarioMarket(tomorrow, marketProvider.getDay(2))).toBe(marketProvider.getDay(2));

    expect(restoreGame(tomorrow)).toEqual(tomorrow);
  });

  it("rejects malformed hands and preserves legacy saves with orders", () => {
    expect(restoreGame({ ...dealt(), dailyScenarios: { 1: { cards: ["fake"] } } })).toEqual(
      createInitialState(),
    );

    const sale = executeSale(createInitialState(), marketProvider.getDay(1), "retailer", 10);

    if (!sale.ok) throw Error(sale.error);

    expect(prepareScenario(restoreGame(sale.state))).toEqual(sale.state);
  });
});
