import { describe, expect, it } from "vitest";
import { compareBuyerReturns } from "@/engine/comparison";
import { createInitialState } from "@/engine/game";
import { executeSale, previewOrder } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
import { addInventoryCrop, selectInventoryCrop } from "@/engine/portfolio";
import { getMarketForGame } from "@/features/pricing/market";
import type { GameResult } from "@/types/game";

const initial = () => createInitialState(marketProvider, { dynamicPricing: false });
const market = marketProvider.getDay(1);
function stateOf(result: GameResult) {
  if (!result.ok) throw Error(result.error);
  return result.state;
}

describe("buyer net-return comparison", () => {
  it("compares one quantity and agrees with actual executed revenue and fees", () => {
    const state = initial();
    const comparison = compareBuyerReturns(state, market, 100);
    expect(comparison.rows.map((row) => row.preview?.quantity)).toEqual([100, 100, 100]);
    expect(comparison.rows.map((row) => row.preview?.netReturn)).toEqual([76, 106, 152]);
    expect(comparison.bestBuyerIds).toEqual(["restaurant"]);
    expect(comparison.advantage).toBe(46);
    for (const row of comparison.rows) {
      const sold = stateOf(executeSale(state, market, row.offer.id, 100));
      expect(sold.transactions[0]).toMatchObject(row.preview!);
    }
    expect(state.transactions).toEqual([]);
  });
  it("accounts for fixed delivery fees when the highest price loses on a small order", () => {
    const offers = market.offers.map((offer) => ({
      ...offer,
      price: offer.id === "restaurant" ? 3 : 2,
      variableCost: 0,
      fixedCost: offer.id === "restaurant" ? 50 : 10,
    }));
    expect(compareBuyerReturns(initial(), { ...market, offers }, 10).bestBuyerIds).toEqual([
      "wholesaler",
      "retailer",
    ]);
    expect(compareBuyerReturns(initial(), { ...market, offers }, 100).bestBuyerIds).toEqual([
      "restaurant",
    ]);
  });
  it("excludes capacity-limited buyers without silently shrinking the requested order", () => {
    const comparison = compareBuyerReturns(initial(), market, 500);
    expect(comparison.bestBuyerIds).toEqual(["wholesaler"]);
    expect(comparison.advantage).toBeNull();
    expect(comparison.rows.map((row) => row.preview?.quantity ?? null)).toEqual([500, null, null]);
    expect(comparison.rows[2].error).toContain("capacity");
  });
  it("excludes closed and already-filled buyers", () => {
    const sold = stateOf(executeSale(initial(), market, "restaurant", 100));
    const closed = {
      ...market,
      offers: market.offers.map((o) => ({ ...o, capacity: o.id === "retailer" ? 0 : o.capacity })),
    };
    const comparison = compareBuyerReturns(sold, closed, 100);
    expect(comparison.bestBuyerIds).toEqual(["wholesaler"]);
    expect(comparison.rows[1].error).toContain("closed");
    expect(comparison.rows[2].error).toContain("already sold");
  });
  it.each([0, -1, NaN, Infinity, 0.001, 1001])(
    "does not recommend an invalid order of %s kg",
    (quantity) => {
      const comparison = compareBuyerReturns(initial(), market, quantity);
      expect(comparison.bestBuyerIds).toEqual([]);
      expect(comparison.bestNetReturn).toBeNull();
      expect(comparison.rows.every((row) => row.preview === null)).toBe(true);
    },
  );
  it("identifies ties and the least negative return without inventing a profit", () => {
    const offers = market.offers.map((offer) => ({
      ...offer,
      price: 1,
      variableCost: 0,
      fixedCost: 20,
    }));
    const comparison = compareBuyerReturns(initial(), { ...market, offers }, 10);
    expect(comparison.bestBuyerIds).toHaveLength(3);
    expect(comparison.bestNetReturn).toBe(-10);
    expect(comparison.advantage).toBe(0);
  });
  it("blocks recommendations before scenario reveal and after completion", () => {
    for (const state of [
      { ...initial(), dailyScenarios: { 1: { cards: ["frost", "rain", "holiday"] } } },
      { ...initial(), completed: true },
      { ...initial(), inventory: 0 },
    ])
      expect(compareBuyerReturns(state, market, 100).bestBuyerIds).toEqual([]);
  });
  it("re-evaluates current-crop eligibility and uses dynamic quotes", () => {
    let state = stateOf(addInventoryCrop(createInitialState(), "apples", 500));
    state = stateOf(executeSale(state, market, "retailer", 50));
    state = selectInventoryCrop(state, "carrots");
    const quotes = getMarketForGame(state);
    const comparison = compareBuyerReturns(state, quotes, 50);
    expect(comparison.rows[1].error).toBeNull();
    expect(comparison.rows[1].preview).toEqual(previewOrder(quotes.offers[1], 50));
    state = selectInventoryCrop(state, "apples");
    expect(compareBuyerReturns(state, getMarketForGame(state), 50).rows[1].error).toContain(
      "already sold",
    );
  });
});
