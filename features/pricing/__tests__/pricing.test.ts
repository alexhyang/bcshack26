import { describe, expect, it, vi } from "vitest";
import {
  CHANNEL_PARAMETERS,
  CROP_PRICING,
  DEMAND_PARAMETERS,
  PRICE_LIMITS,
  getCropPricing,
} from "../config";
import { calculateFinalPrice, calculateFreshnessMultiplier, compareBuyerOffers } from "../pricing";
import { createSeededRandom, weightedRandom } from "../random";
import { generateDemand, generatePriceShock } from "../simulation";
import {
  enableDynamicPricing,
  getCurrentCropMarket,
  getMarketForGame,
  getMarketHistory,
} from "../market";
import { advanceDay, createInitialState } from "@/engine/game";
import { executeSale, previewOrder } from "@/engine/trading";
import { scoreGame } from "@/engine/scoring";
import { restoreGame } from "@/engine/saves";
import { marketProvider } from "@/data/simulated-provider";
import type { GameResult, GameState, BuyerId } from "@/types/game";
import type { RandomSource } from "../types";

function rolls(...values: number[]): RandomSource {
  let index = 0;
  return () => {
    if (index >= values.length) throw Error("Unexpected additional random draw");
    return values[index++];
  };
}
function stateOf(result: GameResult): GameState {
  if (!result.ok) throw Error(result.error);
  return result.state;
}
const seedState = (seed = 123) => createInitialState(marketProvider, { seed });

describe("centralized crop pricing", () => {
  it.each(Object.values(CROP_PRICING))("$name has no freshness penalty at 100%", (crop) => {
    for (const channel of Object.keys(CHANNEL_PARAMETERS) as BuyerId[]) {
      const offer = calculateFinalPrice({
        crop,
        channel,
        marketPrice: 3,
        freshness: 100,
        demand: "medium",
      });
      expect(offer.freshnessMultiplier).toBe(1);
    }
  });
  it("ranks fresh restaurant offers above retailer and wholesaler at equal demand", () => {
    const offers = compareBuyerOffers({
      crop: CROP_PRICING.lettuce,
      marketPrice: 3,
      freshness: 100,
      demand: "medium",
    });
    expect(offers.map((o) => o.finalPrice)).toEqual([4.05, 3.42, 3]);
  });
  it("makes wholesalers beat restaurants for lettuce at 80% freshness", () => {
    const offers = compareBuyerOffers({
      crop: CROP_PRICING.lettuce,
      marketPrice: 3,
      freshness: 80,
      demand: "medium",
    });
    expect(offers[2].finalPrice).toBe(2.28);
    expect(offers[0].finalPrice).toBe(1.81);
    expect(offers[2].finalPrice).toBeGreaterThan(offers[0].finalPrice);
  });
  it("makes high demand > medium demand > low demand", () => {
    const prices = (["high", "medium", "low"] as const).map(
      (demand) =>
        calculateFinalPrice({
          crop: CROP_PRICING.carrots,
          channel: "retailer",
          marketPrice: 3,
          freshness: 80,
          demand,
        }).finalPrice,
    );
    expect(prices[0]).toBeGreaterThan(prices[1]);
    expect(prices[1]).toBeGreaterThan(prices[2]);
  });
  it("applies the exact combined multiplier and rounds only the final price", () => {
    const offer = calculateFinalPrice({
      crop: CROP_PRICING.lettuce,
      channel: "retailer",
      marketPrice: 3,
      freshness: 80,
      demand: "high",
    });
    expect(offer.freshnessMultiplier).toBeCloseTo(0.6);
    expect(offer.combinedMultiplier).toBeCloseTo(1.14 * 0.6 * 1.2);
    expect(offer.finalPrice).toBe(2.46);
  });
  it("uses crop-specific sensitivities", () => {
    const ids = ["strawberries", "lettuce", "tomatoes", "carrots", "potatoes"];
    const multipliers = ids.map((id) =>
      calculateFreshnessMultiplier(80, 2.2, CROP_PRICING[id].freshnessSensitivity),
    );
    for (let index = 1; index < multipliers.length; index++)
      expect(multipliers[index]).toBeGreaterThan(multipliers[index - 1]);
  });
  it("clamps freshness and returns nonnegative prices at every freshness level", () => {
    for (const crop of Object.values(CROP_PRICING))
      for (const channel of Object.keys(CHANNEL_PARAMETERS) as BuyerId[]) {
        let previous = Infinity;
        for (let freshness = 100; freshness >= 0; freshness--) {
          const price = calculateFinalPrice({
            crop,
            channel,
            marketPrice: 3,
            freshness,
            demand: "medium",
          });
          expect(price.finalPrice).toBeGreaterThanOrEqual(0);
          expect(price.freshnessMultiplier).toBeGreaterThanOrEqual(0);
          expect(price.finalPrice).toBeLessThanOrEqual(previous);
          previous = price.finalPrice;
          if (freshness === 0) expect(price.finalPrice).toBe(0);
        }
      }
    expect(calculateFreshnessMultiplier(200, 2.2, 1)).toBe(1);
    expect(calculateFreshnessMultiplier(-10, 2.2, 1)).toBe(0);
    expect(
      calculateFinalPrice({
        crop: CROP_PRICING.lettuce,
        channel: "restaurant",
        marketPrice: -99,
        freshness: 100,
        demand: "high",
      }).finalPrice,
    ).toBe(0);
  });
  it("keeps unknown existing crops with a default sensitivity", () => {
    expect(getCropPricing({ id: "beets", name: "Beets", symbol: "BET" })).toMatchObject({
      id: "beets",
      name: "Beets",
      freshnessSensitivity: 0.65,
    });
    expect(
      getCropPricing({ id: "beets", name: "Beets", symbol: "BET", freshnessSensitivity: 0.4 })
        .freshnessSensitivity,
    ).toBe(0.4);
  });
});
describe("weighted demand and daily shocks", () => {
  it.each([
    [0, "high"],
    [0.249999, "high"],
    [0.25, "medium"],
    [0.749999, "medium"],
    [0.75, "low"],
    [0.999999, "low"],
  ] as const)("maps demand roll %s to %s", (roll, bucket) =>
    expect(generateDemand(() => roll)).toBe(bucket),
  );
  it("implements the configured demand probabilities over uniform rolls", () => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (let i = 0; i < 10000; i++) counts[generateDemand(() => (i + 0.5) / 10000)]++;
    expect(counts).toEqual({ high: 2500, medium: 5000, low: 2500 });
    expect(DEMAND_PARAMETERS.map((d) => d.multiplier)).toEqual([1.2, 1, 0.85]);
  });
  it("validates weighted selections and supports arbitrary weights", () => {
    expect(
      weightedRandom(
        [
          { value: "a", weight: 1 },
          { value: "b", weight: 3 },
        ],
        () => 0.5,
      ),
    ).toBe("b");
    expect(() => weightedRandom([], () => 0.5)).toThrow();
    expect(() => weightedRandom([{ value: 1, weight: -1 }], () => 0.5)).toThrow();
    expect(() => generateDemand(() => 1)).toThrow();
  });
  it.each(Object.values(CROP_PRICING))(
    "uses $name probability, 50/50 direction, and configured magnitude",
    (crop) => {
      const unchanged = generatePriceShock(crop.referencePrice, crop, rolls(crop.shockProbability));
      expect(unchanged.marketPrice).toBe(crop.referencePrice);
      expect(unchanged.shockOccurred).toBe(false);
      const down = generatePriceShock(
        crop.referencePrice,
        crop,
        rolls(crop.shockProbability - 0.00001, 0.499999, 0),
      );
      const up = generatePriceShock(crop.referencePrice, crop, rolls(0, 0.5, 0.999999));
      expect(down.marketPrice).toBeCloseTo(crop.referencePrice * (1 - crop.shockMin));
      expect(down.shockMagnitude).toBe(crop.shockMin);
      expect(up.marketPrice).toBeGreaterThan(crop.referencePrice);
      expect(up.shockMagnitude).toBeGreaterThanOrEqual(crop.shockMin);
      expect(up.shockMagnitude).toBeLessThanOrEqual(crop.shockMax);
      let shocks = 0;
      for (let i = 0; i < 1000; i++)
        if (
          generatePriceShock(crop.referencePrice, crop, rolls((i + 0.5) / 1000, 0.8, 0.5))
            .shockOccurred
        )
          shocks++;
      expect(shocks).toBe(crop.shockProbability * 1000);
    },
  );
  it("caps each market relative to its reference and never below zero", () => {
    for (const crop of Object.values(CROP_PRICING)) {
      expect(
        generatePriceShock(crop.referencePrice * 1.6, crop, rolls(0, 0.9, 0.99)).marketPrice,
      ).toBeCloseTo(crop.referencePrice * PRICE_LIMITS.max);
      expect(
        generatePriceShock(crop.referencePrice * 0.6, crop, rolls(0, 0.1, 0.99)).marketPrice,
      ).toBeCloseTo(crop.referencePrice * PRICE_LIMITS.min);
      expect(generatePriceShock(-3, crop, rolls(0.99)).marketPrice).toBeGreaterThanOrEqual(0);
    }
  });
  it("reproduces injected seeds", () => {
    const first = createSeededRandom(17),
      second = createSeededRandom(17);
    expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second));
  });
});
describe("pricing integrated into the saved seven-day game", () => {
  it("rolls independent demands for every configured crop", () => {
    const state = seedState();
    const snapshot = state.pricing!.history[0];
    expect(Object.keys(snapshot.crops).sort()).toEqual(Object.keys(CROP_PRICING).sort());
    expect(new Set(Object.values(snapshot.crops).map((c) => c.demand)).size).toBeGreaterThan(1);
    expect(seedState().pricing).toEqual(state.pricing);
    expect(seedState(456).pricing!.history).not.toEqual(state.pricing!.history);
  });
  it("does not reroll during renders, comparisons, or sales", () => {
    const state = seedState();
    const before = JSON.stringify(state.pricing);
    for (let i = 0; i < 20; i++) {
      getMarketForGame(state);
      getMarketHistory(state);
    }
    const sold = stateOf(executeSale(state, marketProvider.getDay(1), "restaurant", 100));
    expect(JSON.stringify(sold.pricing)).toBe(before);
    const demands = getCurrentCropMarket(state)!.channelDemand!;
    expect(getMarketForGame(state).offers.every((o) => o.pricing?.demand === demands[o.id])).toBe(
      true,
    );
  });
  it("uses the same computed quote in display, preview, and execution", () => {
    const state = { ...seedState(), freshness: 80 };
    const offer = getMarketForGame(state).offers[1];
    const preview = previewOrder(offer, 100);
    const forged = {
      ...marketProvider.getDay(1),
      offers: marketProvider.getDay(1).offers.map((o) => ({ ...o, price: 999 })),
    };
    const sold = stateOf(executeSale(state, forged, "retailer", 100));
    expect(sold.transactions[0]).toMatchObject({
      price: offer.price,
      pricing: offer.pricing,
      netReturn: preview.netReturn,
    });
    expect(sold.cash).toBe(preview.netReturn);
    expect(sold.inventory).toBe(900);
  });
  it("advances prices once without resetting the inventory, transactions or accounting", () => {
    const original = seedState();
    const sold = stateOf(executeSale(original, marketProvider.getDay(1), "wholesaler", 200));
    const next = stateOf(advanceDay(sold));
    expect(next).toMatchObject({
      day: 2,
      inventory: 784,
      freshness: 93,
      storageCosts: 20,
      spoiled: 16,
    });
    expect(next.cash).toBeCloseTo(sold.cash - 20);
    expect(next.transactions).toEqual(sold.transactions);
    expect(next.pricing!.history).toHaveLength(2);
    expect(next.pricing!.history[0]).toEqual(original.pricing!.history[0]);
    expect(Object.keys(next.pricing!.history[1].crops)).toHaveLength(5);
    expect(getMarketHistory(next).map((d) => d.day)).toEqual([1, 2]);
  });
  it("persists demand, shocks, quotes and historical order prices across reloads", () => {
    let state = seedState();
    for (let day = 1; day <= 7; day++) {
      const market = getMarketForGame(state);
      const qty = Math.min(state.inventory, market.offers[2].capacity);
      if (qty > 0)
        state = stateOf(executeSale(state, marketProvider.getDay(day), "restaurant", qty));
      state = stateOf(advanceDay(state));
      expect(restoreGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
      expect(state.cash).toBeCloseTo(state.grossRevenue - state.sellingCosts - state.storageCosts);
      expect(
        state.transactions.reduce((n, t) => n + t.quantity, 0) + state.spoiled + state.inventory,
      ).toBeCloseTo(1000);
    }
    expect(state.pricing!.history).toHaveLength(7);
    expect(state.completed).toBe(true);
  });
  it("migrates original saves without repricing old trades or resetting cash", () => {
    const initial = createInitialState(marketProvider, { dynamicPricing: false });
    const old = stateOf(
      advanceDay(stateOf(executeSale(initial, marketProvider.getDay(1), "restaurant", 100))),
    );
    const migrated = restoreGame(old);
    expect(migrated).toMatchObject(old);
    expect(migrated.transactions[0].price).toBe(2.08);
    expect(migrated.pricing).toMatchObject({ startedDay: 2, legacyTransactionCount: 1 });
    const sold = stateOf(executeSale(migrated, marketProvider.getDay(2), "retailer", 100));
    expect(sold.transactions[1].pricing).toBeDefined();
    expect(restoreGame(sold)).toEqual(sold);
    const advanced = stateOf(advanceDay(sold));
    expect(restoreGame(advanced)).toEqual(advanced);
    expect(scoreGame(advanced).baseline).toBe(976);
  });
  it("migrates same-day old trades and preserves them after new dynamic trades", () => {
    const old = stateOf(
      executeSale(
        createInitialState(marketProvider, { dynamicPricing: false }),
        marketProvider.getDay(1),
        "restaurant",
        100,
      ),
    );
    const migrated = restoreGame(old);
    const sold = stateOf(executeSale(migrated, marketProvider.getDay(1), "retailer", 100));
    expect(restoreGame(sold)).toEqual(sold);
    expect(sold.transactions[0]).toEqual(old.transactions[0]);
  });
  it("rebuilds tampered cached history and calculates a fair opening-day baseline", () => {
    const state = seedState();
    const baseline = previewOrder(getMarketForGame(state).offers[0], 1000).netReturn;
    expect(scoreGame(state).baseline).toBe(baseline);
    expect(restoreGame({ ...state, pricing: { ...state.pricing, history: [] } })).toEqual(state);
  });
  it("keeps a live provider's quotes outside the simulated random system", () => {
    const live = {
      scenarioId: marketProvider.scenarioId,
      duration: marketProvider.duration,
      crop: marketProvider.crop,
      mode: "live" as const,
      getDay: marketProvider.getDay.bind(marketProvider),
      getHistory: marketProvider.getHistory.bind(marketProvider),
    };
    const state = createInitialState(live);
    expect(state.pricing).toBeUndefined();
    expect(getMarketForGame(state, live)).toBe(live.getDay(1));
  });
});

describe("opening-market persistence", () => {
  it("saves the first market before any trade so a reload cannot reroll it", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    try {
      const { useGameStore } = await import("@/store/gameStore");
      await useGameStore.persist.rehydrate();
      const opening = useGameStore.getState().game;
      expect(opening.transactions).toHaveLength(0);
      const persisted = JSON.parse(values.get("farmstreet-save")!);
      expect(persisted.state.game).toEqual(opening);
      expect(restoreGame(persisted.state.game)).toEqual(opening);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("independent channel demand", () => {
  it("can give wholesalers high demand while restaurants have low demand on the same day", () => {
    const states = Array.from({ length: 100 }, (_, seed) => seedState(seed));
    const state = states.find((state) => {
      const demands = getCurrentCropMarket(state)!.channelDemand!;
      return demands.wholesaler === "high" && demands.restaurant === "low";
    });
    expect(state).toBeDefined();
    const offers = getMarketForGame(state!).offers;
    expect(offers.find((o) => o.id === "wholesaler")!.pricing!.demandMultiplier).toBe(1.2);
    expect(offers.find((o) => o.id === "restaurant")!.pricing!.demandMultiplier).toBe(0.85);
    expect(getMarketForGame(restoreGame(state))).toEqual(getMarketForGame(state!));
  });
  it("preserves legacy orders and quotes and enables channel demand on the next day", () => {
    const legacy = enableDynamicPricing(
      createInitialState(marketProvider, { dynamicPricing: false }),
      321,
      0,
      marketProvider,
      { version: 1 },
    );
    const sold = stateOf(executeSale(legacy, marketProvider.getDay(1), "retailer", 100));
    const migrated = restoreGame(JSON.parse(JSON.stringify(sold)));
    expect(migrated.transactions).toEqual(sold.transactions);
    expect(migrated.cash).toBe(sold.cash);
    expect(getMarketForGame(migrated)).toEqual(getMarketForGame(sold));
    expect(migrated.pricing!.channelDemandStartedDay).toBe(2);
    const next = stateOf(advanceDay(migrated));
    expect(getCurrentCropMarket(next)!.channelDemand).toBeDefined();
    expect(getMarketHistory(next)[0]).toEqual(getMarketHistory(sold)[0]);
    expect(restoreGame(JSON.parse(JSON.stringify(next)))).toEqual(next);
  });
});
