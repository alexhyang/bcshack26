import { describe, expect, it } from "vitest";
import { CROP_CHOICES, getGameCrop, validHarvest } from "@/data/crops";
import { createInitialState, advanceDay } from "@/engine/game";
import { restoreGame } from "@/engine/saves";
import { executeSale, previewOrder } from "@/engine/trading";
import { scoreGame } from "@/engine/scoring";
import { marketProvider } from "@/data/simulated-provider";
import { getMarketForGame } from "@/features/pricing/market";
import { useGameStore } from "@/store/gameStore";

describe("configurable harvest", () => {
  it.each(CROP_CHOICES)("prices and restores $name with a custom harvest", (crop) => {
    const state = createInitialState(marketProvider, {
      seed: 123,
      harvest: { cropId: crop.id, initialInventory: 437.5 },
    });
    expect(state.inventory).toBe(437.5);
    expect(getGameCrop(state).name).toBe(crop.name);
    const market = getMarketForGame(state);
    expect(market.offers.every((o) => o.pricing?.cropId === crop.id)).toBe(true);
    const sale = executeSale(state, market, "wholesaler", 100);
    if (!sale.ok) throw Error(sale.error);
    expect(sale.state.inventory).toBe(337.5);
    expect(restoreGame(JSON.parse(JSON.stringify(sale.state)))).toEqual(sale.state);
    const score = scoreGame(sale.state);
    expect(score.soldPercent).toBeCloseTo(22.86);
    expect(score.baseline).toBe(previewOrder(market.offers[0], 437.5).netReturn);
  });
  it("keeps crop selection and accounting throughout a full season", () => {
    let state = createInitialState(marketProvider, {
      seed: 321,
      harvest: { cropId: "blueberries", initialInventory: 875 },
    });
    for (let day = 1; day <= 7; day++) {
      const sale = executeSale(state, marketProvider.getDay(day), "retailer", 25);
      if (!sale.ok) throw Error(sale.error);
      const result = advanceDay(sale.state);
      if (!result.ok) throw Error(result.error);
      state = result.state;
      expect(restoreGame(state)).toEqual(state);
      expect(getMarketForGame(state).offers[0].pricing?.cropId).toBe("blueberries");
    }
    const score = scoreGame(state);
    expect(score.sold + score.spoiled + score.unsold).toBeCloseTo(875);
  });
  it("validates crop and kilograms and prevents changing a traded harvest", () => {
    for (const initialInventory of [0, -1, NaN, Infinity, 1.001, 100000001])
      expect(validHarvest({ cropId: "wheat", initialInventory })).toBe(false);
    expect(validHarvest({ cropId: "unknown", initialInventory: 100 })).toBe(false);
    useGameStore.setState({ game: createInitialState() });
    expect(useGameStore.getState().configureHarvest("wheat", 500).ok).toBe(true);
    useGameStore.getState().dealScenario();
    useGameStore.getState().pickScenario(0);
    const game = useGameStore.getState().game;
    const buyer = getMarketForGame(game).offers.find((o) => o.capacity > 0)!;
    expect(useGameStore.getState().sell(buyer.id, 10).ok).toBe(true);
    expect(useGameStore.getState().configureHarvest("apples", 200).ok).toBe(false);
    useGameStore.getState().reset();
    expect(getGameCrop(useGameStore.getState().game)).toMatchObject({
      id: "wheat",
      initialInventory: 500,
    });
    expect(useGameStore.getState().game.inventory).toBe(500);
  });
});
