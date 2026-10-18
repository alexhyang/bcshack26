import { describe, expect, it } from "vitest";
import { createInitialState, advanceDay } from "@/engine/game";
import {
  addInventoryCrop,
  removeInventoryCrop,
  selectInventoryCrop,
  totalInventory,
  initialInventory,
} from "@/engine/portfolio";
import { executeSale } from "@/engine/trading";
import { restoreGame } from "@/engine/saves";
import { scoreGame } from "@/engine/scoring";
import { CROP_CHOICES, getGameCrop } from "@/data/crops";
import { marketProvider } from "@/data/simulated-provider";
import { getMarketForGame, getMarketHistory } from "@/features/pricing/market";
import type { GameResult } from "@/types/game";
const stateOf = (result: GameResult) => {
  if (!result.ok) throw Error(result.error);
  return result.state;
};
const empty = () => removeInventoryCrop(createInitialState(), "carrots");

describe("sidebar crop inventory", () => {
  it("adds several crops, combines repeated additions, and switches without replacing stock", () => {
    let state = stateOf(addInventoryCrop(empty(), "apples", 200));
    state = stateOf(addInventoryCrop(state, "potatoes", 500));
    state = stateOf(addInventoryCrop(state, "apples", 25.5));
    expect(state.cropInventory).toHaveLength(2);
    expect(totalInventory(state)).toBe(725.5);
    expect(state.inventory).toBe(225.5);
    const switched = selectInventoryCrop(state, "potatoes");
    expect(switched.inventory).toBe(500);
    expect(switched.cash).toBe(state.cash);
    expect(switched.day).toBe(1);
    expect(
      getMarketForGame(switched).offers.every((offer) => offer.pricing?.cropId === "potatoes"),
    ).toBe(true);
    expect(totalInventory(removeInventoryCrop(switched, "apples"))).toBe(500);
  });
  it.each(CROP_CHOICES)("supports $name as an inventory entry", (crop) => {
    const state = stateOf(addInventoryCrop(empty(), crop.id, 123.45));
    expect(getGameCrop(state).name).toBe(crop.name);
    expect(getMarketForGame(state).offers[0].pricing?.cropId).toBe(crop.id);
    expect(restoreGame(state)).toEqual(state);
  });
  it("sells different crops independently to the same buyer and restores active selection", () => {
    let state = stateOf(addInventoryCrop(empty(), "apples", 200));
    state = stateOf(addInventoryCrop(state, "potatoes", 500));
    state = selectInventoryCrop(state, "apples");
    state = stateOf(executeSale(state, marketProvider.getDay(1), "retailer", 50));
    expect(executeSale(state, marketProvider.getDay(1), "retailer", 1).ok).toBe(false);
    state = selectInventoryCrop(state, "potatoes");
    state = stateOf(executeSale(state, marketProvider.getDay(1), "retailer", 100));
    expect(state.transactions.map((trade) => trade.cropId)).toEqual(["apples", "potatoes"]);
    expect(state.cropInventory?.map((item) => item.inventory)).toEqual([150, 400]);
    expect(totalInventory(state)).toBe(550);
    expect(restoreGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(addInventoryCrop(state, "wheat", 50).ok).toBe(false);
    expect(removeInventoryCrop(state, "potatoes")).toBe(state);
    expect(scoreGame(state).soldPercent).toBeCloseTo(21.43);
  });
  it("stores and spoils every crop each day and conserves the full portfolio through a season", () => {
    let state = stateOf(addInventoryCrop(empty(), "apples", 333.33));
    state = stateOf(addInventoryCrop(state, "potatoes", 666.67));
    for (let day = 1; day <= 7; day++) {
      for (const cropId of ["apples", "potatoes"]) {
        state = selectInventoryCrop(state, cropId);
        state = stateOf(executeSale(state, marketProvider.getDay(day), "retailer", 10));
      }
      const before = state;
      state = stateOf(advanceDay(state));
      expect(restoreGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
      if (day < 7) expect(state.storageCosts).toBeGreaterThan(before.storageCosts);
      expect(
        totalInventory(state) +
          state.spoiled +
          state.transactions.reduce((sum, trade) => sum + trade.quantity, 0),
      ).toBeCloseTo(initialInventory(state), 2);
    }
    expect(state.completed).toBe(true);
    expect(scoreGame(state).unsold).toBe(totalInventory(state));
    expect(getMarketHistory(state)).toHaveLength(7);
  });
  it("rejects invalid inventory and rebuilds cached quantities", () => {
    for (const amount of [0, -1, Infinity, NaN, 1.001])
      expect(addInventoryCrop(empty(), "apples", amount).ok).toBe(false);
    expect(addInventoryCrop(empty(), "unknown", 20).ok).toBe(false);
    const state = stateOf(addInventoryCrop(empty(), "wheat", 50));
    expect(
      restoreGame({
        ...state,
        cash: 999,
        inventory: 999,
        cropInventory: state.cropInventory?.map((item) => ({
          ...item,
          inventory: 999,
          spoiled: 500,
        })),
      }),
    ).toEqual(state);
    expect(restoreGame({ ...state, activeCropId: "unknown" })).toMatchObject(createInitialState());
    expect(
      restoreGame({ ...state, cropInventory: [state.cropInventory![0], state.cropInventory![0]] }),
    ).toMatchObject(createInitialState());
    expect(scoreGame(empty()).soldPercent).toBe(0);
  });
});
