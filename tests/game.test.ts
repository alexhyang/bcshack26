import { describe, it, expect } from "vitest";
import { advanceDay, createInitialState as createState } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { scoreGame } from "@/engine/scoring";
import { marketProvider } from "@/data/simulated-provider";
const createInitialState = () => createState(marketProvider, { dynamicPricing: false });
import { holdOvernight } from "@/engine/inventory";
import type { GameState } from "@/types/game";

function next(state: GameState) {
  const result = advanceDay(state);
  if (!result.ok) throw Error(result.error);
  return result.state;
}
describe("seven-day simulation", () => {
  it("initializes a reproducible 1000 kg harvest", () => {
    expect(createInitialState()).toMatchObject({
      day: 1,
      inventory: 1000,
      freshness: 100,
      cash: 0,
      completed: false,
    });
    expect(createInitialState()).toEqual(createInitialState());
  });
  it("charges storage on held inventory, then applies spoilage and freshness loss", () => {
    const state = next(createInitialState());
    expect(state).toMatchObject({
      day: 2,
      inventory: 980,
      spoiled: 20,
      freshness: 93,
      storageCosts: 25,
      cash: -25,
    });
    expect(state.summaries[0].feedback).toContain("1000 kg");
  });
  it("stores only inventory that was not sold", () => {
    const sold = executeSale(createInitialState(), marketProvider.getDay(1), "wholesaler", 600);
    if (!sold.ok) throw Error("Expected valid sale");
    expect(next(sold.state)).toMatchObject({
      day: 2,
      inventory: 392,
      storageCosts: 10,
      spoiled: 8,
      cash: 566,
    });
  });
  it("applies event effects exactly once", () => {
    const hot = marketProvider.getDay(5);
    expect(holdOvernight(100, 70, hot)).toEqual({
      inventory: 92,
      storageCosts: 4.5,
      spoiled: 8,
      freshness: 52,
    });
    expect(hot.offers[1].price).toBe(2.12);
  });
  it("resets buyer availability on a new day", () => {
    const first = executeSale(createInitialState(), marketProvider.getDay(1), "restaurant", 100);
    if (!first.ok) throw Error("Expected valid sale");
    const day2 = next(first.state);
    expect(executeSale(day2, marketProvider.getDay(2), "restaurant", 100).ok).toBe(true);
  });
  it("allows trading on Day 7 and ends only on the final advance", () => {
    let state = createInitialState();
    for (let i = 0; i < 6; i++) state = next(state);
    expect(state.day).toBe(7);
    expect(state.completed).toBe(false);
    const sale = executeSale(state, marketProvider.getDay(7), "wholesaler", state.inventory);
    if (!sale.ok) throw Error(sale.error);
    const final = next(sale.state);
    expect(final.completed).toBe(true);
    expect(final.day).toBe(7);
    expect(final.summaries).toHaveLength(7);
    expect(final.storageCosts).toBe(state.storageCosts);
    expect(advanceDay(final).ok).toBe(false);
  });
  it("adds no phantom overnight expense to unsold stock after Day 7", () => {
    let state = createInitialState();
    for (let i = 0; i < 6; i++) state = next(state);
    const final = next(state);
    expect(final.inventory).toBe(state.inventory);
    expect(final.spoiled).toBe(state.spoiled);
    expect(final.storageCosts).toBe(state.storageCosts);
  });
  it("charges no holding costs for an empty warehouse", () => {
    const sale = executeSale(createInitialState(), marketProvider.getDay(1), "wholesaler", 1000);
    if (!sale.ok) throw Error("Expected valid sale");
    let state = sale.state;
    for (let i = 0; i < 7; i++) state = next(state);
    expect(state.cash).toBe(976);
    expect(state.storageCosts).toBe(0);
    expect(state.spoiled).toBe(0);
  });
  it("maintains harvest and money accounting across a complete mixed strategy", () => {
    let state = createInitialState();
    for (let day = 1; day <= 7; day++) {
      const market = marketProvider.getDay(day);
      const quantity = Math.min(state.inventory, market.offers[2].capacity);
      if (quantity > 0) {
        const sale = executeSale(state, market, "restaurant", quantity);
        if (!sale.ok) throw Error(sale.error);
        state = sale.state;
      }
      state = next(state);
      const score = scoreGame(state);
      expect(score.sold + state.spoiled + state.inventory).toBeCloseTo(1000, 2);
      expect(state.cash).toBeCloseTo(
        state.grossRevenue - state.sellingCosts - state.storageCosts,
        2,
      );
    }
    const score = scoreGame(state);
    expect(score.takeaways).toHaveLength(3);
    expect(score.wastedOrUnsold).toBeCloseTo(1000 - score.sold, 2);
    expect(score.baselineDifference).toBeCloseTo(score.netMargin - 976, 2);
  });
  it("computes the exact baseline score", () => {
    const sale = executeSale(createInitialState(), marketProvider.getDay(1), "wholesaler", 1000);
    if (!sale.ok) throw Error("Expected valid sale");
    expect(scoreGame(sale.state)).toMatchObject({
      grossRevenue: 1120,
      sellingCosts: 144,
      storageCosts: 0,
      netMargin: 976,
      sold: 1000,
      wastedOrUnsold: 0,
      soldPercent: 100,
      baseline: 976,
      baselineDifference: 0,
    });
  });
  it("never exposes unreached days through historical data", () => {
    expect(marketProvider.getHistory(1).map((d) => d.day)).toEqual([1]);
    expect(marketProvider.getHistory(3).map((d) => d.day)).toEqual([1, 2, 3]);
    expect(() => marketProvider.getDay(8)).toThrow();
    expect(() => marketProvider.getHistory(0)).toThrow();
    expect(Object.isFrozen(marketProvider.getDay(1).offers[0])).toBe(true);
  });
  it("creates a clean independent state for reset", () => {
    const played = next(createInitialState());
    const fresh = createInitialState();
    expect(fresh.day).toBe(1);
    expect(fresh.cash).toBe(0);
    expect(fresh.transactions).toEqual([]);
    expect(fresh.summaries).toEqual([]);
    expect(played.day).toBe(2);
  });
});
