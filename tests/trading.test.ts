import { describe, it, expect } from "vitest";
import { createInitialState as createState } from "@/engine/game";
import { executeSale, previewOrder } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
const createInitialState = () => createState(marketProvider, { dynamicPricing: false });
import { remainingCapacity } from "@/engine/market";
import type { BuyerId } from "@/types/game";

const day = marketProvider.getDay(1);
describe("sale execution", () => {
  it("sells an eligible quantity and records the executed price and costs", () => {
    const initial = createInitialState();
    const result = executeSale(initial, day, "retailer", 200);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.inventory).toBe(800);
    expect(result.state.grossRevenue).toBe(328);
    expect(result.state.sellingCosts).toBe(86);
    expect(result.state.cash).toBe(242);
    expect(result.state.transactions[0]).toMatchObject({
      quantity: 200,
      price: 1.64,
      fixedCost: 30,
      variableCost: 56,
      netReturn: 242,
    });
    expect(initial.inventory).toBe(1000);
    expect(initial.transactions).toHaveLength(0);
  });
  it("rejects an order exceeding inventory", () => {
    const result = executeSale({ ...createInitialState(), inventory: 100 }, day, "wholesaler", 101);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("inventory") });
  });
  it("rejects an order exceeding buyer capacity", () => {
    expect(executeSale(createInitialState(), day, "restaurant", 161)).toEqual({
      ok: false,
      error: expect.stringContaining("capacity"),
    });
  });
  it("blocks a second order to a buyer even if the first was below capacity", () => {
    const first = executeSale(createInitialState(), day, "restaurant", 10);
    if (!first.ok) throw Error("Expected valid sale");
    expect(executeSale(first.state, day, "restaurant", 10)).toEqual({
      ok: false,
      error: expect.stringContaining("already sold"),
    });
    expect(remainingCapacity(first.state, day, "restaurant")).toBe(0);
  });
  it("accepts sales to multiple buyers on one day", () => {
    const first = executeSale(createInitialState(), day, "restaurant", 160);
    if (!first.ok) throw Error("Expected valid sale");
    const next = executeSale(first.state, day, "retailer", 360);
    expect(next.ok).toBe(true);
    if (next.ok) expect(next.state.inventory).toBe(480);
  });
  it.each([0, -1, NaN, Infinity, -Infinity, 1.001])(
    "rejects invalid quantity %s without charging fees",
    (quantity) => {
      const initial = createInitialState();
      expect(executeSale(initial, day, "restaurant", quantity).ok).toBe(false);
      expect(initial.cash).toBe(0);
      expect(initial.transactions).toHaveLength(0);
    },
  );
  it("rejects an unknown buyer and stale quotes", () => {
    expect(executeSale(createInitialState(), day, "unknown" as BuyerId, 10).ok).toBe(false);
    expect(executeSale(createInitialState(), marketProvider.getDay(2), "restaurant", 10).ok).toBe(
      false,
    );
  });
  it("rounds fractional quantities and currency consistently", () => {
    const result = executeSale(createInitialState(), day, "restaurant", 12.34);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.inventory).toBe(987.66);
    expect(result.state.grossRevenue).toBe(25.67);
    expect(result.state.sellingCosts).toBe(22.69);
    expect(result.state.cash).toBe(2.98);
  });
  it("calculates a full-harvest wholesale baseline", () => {
    expect(previewOrder(day.offers[0], 1000)).toEqual({
      quantity: 1000,
      grossRevenue: 1120,
      fixedCost: 24,
      variableCost: 120,
      sellingCosts: 144,
      netReturn: 976,
    });
  });
  it("does not silently reject a valid sale at a loss", () => {
    const result = executeSale(createInitialState(), day, "restaurant", 1);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.cash).toBe(-16.3);
  });
  it("rejects trades after the game ends", () => {
    expect(
      executeSale({ ...createInitialState(), completed: true }, day, "wholesaler", 100).ok,
    ).toBe(false);
  });
});
