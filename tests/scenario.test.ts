import { describe, expect, it } from "vitest";

import { createInitialState, advanceDay } from "@/engine/game";

import { executeSale } from "@/engine/trading";

import { restoreGame } from "@/engine/saves";

import { marketProvider } from "@/data/simulated-provider";

import {
  SCENARIO_EVENTS,
  SCENARIO_CHANNEL_REASONS,
  scenarioSentiment,
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
  it("deals three cards and keeps a hand stable", () => {
    expect(dealScenarios(() => 0)).toEqual(["peaceful", "peaceful", "peaceful"]);
    expect(new Set(dealScenarios(() => 0.5)).size).toBe(3);

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

it("labels grower benefits, penalties, and mixed effects and explains every channel", () => {
  const find = (id: string) => SCENARIO_EVENTS.find((event) => event.id === id)!;
  expect(scenarioSentiment(find("frost"))).toBe("positive");
  expect(scenarioSentiment(find("bumper"))).toBe("negative");
  expect(scenarioSentiment(find("holiday"))).toBe("mixed");
  expect(scenarioSentiment(find("strike"))).toBe("mixed");
  for (const event of SCENARIO_EVENTS) {
    for (const buyer of ["wholesaler", "retailer", "restaurant"] as const) {
      expect(SCENARIO_CHANNEL_REASONS[event.id][buyer].length).toBeGreaterThan(0);
    }
  }
});

it("splits each card equally between peaceful and the twelve event outcomes", () => {
  // Exact grid across both random draws: no flaky statistical sampling.
  const counts = new Map<string, number>();
  for (let coin = 0; coin < 24; coin++) {
    for (let event = 0; event < 12; event++) {
      let call = 0;
      const hand = dealScenarios(() => (call++ === 0 ? (coin + 0.5) / 24 : (event + 0.5) / 12));
      counts.set(hand[0], (counts.get(hand[0]) ?? 0) + 1);
    }
  }
  expect(counts.get("peaceful")).toBe(144);
  for (const scenario of SCENARIO_EVENTS.filter((e) => e.id !== "peaceful"))
    expect(counts.get(scenario.id)).toBe(12);
});

it("restores repeated peaceful cards and keeps all channel prices and capacities unchanged", () => {
  const initial = {
    ...createInitialState(),
    dailyScenarios: { 1: { cards: ["peaceful", "peaceful", "peaceful"] } },
  };
  const picked = chooseScenario(initial, 1);
  if (!picked.ok) throw Error(picked.error);
  expect(picked.state.dailyScenarios?.[1].selectedIndex).toBe(1);
  expect(scenarioMarket(picked.state, marketProvider.getDay(1)).offers).toEqual(
    marketProvider.getDay(1).offers,
  );
  expect(scenarioSentiment(getScenario(picked.state)!)).toBe("neutral");
  expect(restoreGame(picked.state)).toEqual(picked.state);
  expect(chooseScenario(picked.state, 0).ok).toBe(false);
});
