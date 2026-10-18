import { describe, expect, it } from "vitest";
import { marketProvider } from "@/data/simulated-provider";
import { advanceDay, createInitialState } from "@/engine/game";
import { restoreGame } from "@/engine/saves";
import { SCENARIO_EVENTS, chooseScenario, scenarioMarket } from "@/engine/scenario";
import { executeSale, previewOrder } from "@/engine/trading";
import { scoreGame } from "@/engine/scoring";
import type { GameResult, GameState } from "@/types/game";
import { getMarketForGame, getMarketHistory } from "../market";

function stateOf(result: GameResult): GameState {
  if (!result.ok) throw Error(result.error);
  return result.state;
}
function select(state: GameState, eventId: string): GameState {
  const cards = [
    eventId,
    ...SCENARIO_EVENTS.filter((e) => e.id !== eventId)
      .slice(0, 2)
      .map((e) => e.id),
  ];
  return stateOf(
    chooseScenario(
      {
        ...state,
        dailyScenarios: { ...state.dailyScenarios, [state.day]: { cards } },
      },
      0,
    ),
  );
}

describe("scenario cards combined with dynamic pricing", () => {
  it.each(SCENARIO_EVENTS)("applies $id once to quotes, trades, and restored history", (event) => {
    const opening = createInitialState(marketProvider, { seed: 456 });
    const state = select(opening, event.id);
    const market = getMarketForGame(state);
    for (const offer of market.offers) {
      const base = getMarketForGame(opening).offers.find((o) => o.id === offer.id)!;
      const breakdown = offer.pricing!;
      expect(offer.price).toBe(
        Math.round(
          base.pricing!.marketPrice *
            base.pricing!.combinedMultiplier *
            event.multipliers[offer.id] *
            100,
        ) / 100,
      );
      expect(breakdown.scenarioMultiplier).toBe(event.multipliers[offer.id]);
      expect(breakdown.finalPrice).toBe(offer.price);
      expect(offer.capacity).toBe(event.closed === offer.id ? 0 : base.capacity);
    }
    expect(scenarioMarket(state, market)).toBe(market);
    const buyer = market.offers.find((o) => o.capacity > 0)!;
    const preview = previewOrder(buyer, 100);
    const rawSale = stateOf(executeSale(state, marketProvider.getDay(1), buyer.id, 100));
    const displayedSale = stateOf(executeSale(state, market, buyer.id, 100));
    expect(rawSale).toEqual(displayedSale);
    expect(rawSale.transactions[0]).toMatchObject({
      price: buyer.price,
      netReturn: preview.netReturn,
      pricing: buyer.pricing,
    });
    if (event.closed)
      expect(executeSale(state, marketProvider.getDay(1), event.closed, 1)).toEqual({
        ok: false,
        error: "This buyer is closed today.",
      });
    expect(restoreGame(JSON.parse(JSON.stringify(rawSale)))).toEqual(rawSale);
    const next = stateOf(advanceDay(rawSale));
    expect(getMarketHistory(next)[0].offers).toEqual(market.offers);
    expect(getMarketForGame(next).offers.every((o) => o.pricing?.scenarioMultiplier === 1)).toBe(
      true,
    );
    expect(restoreGame(JSON.parse(JSON.stringify(next)))).toEqual(next);
  });

  it("preserves pre-pricing scenario orders when migrating and trading again that day", () => {
    const original = select(createInitialState(marketProvider, { dynamicPricing: false }), "frost");
    const oldSale = stateOf(
      executeSale(original, scenarioMarket(original, marketProvider.getDay(1)), "restaurant", 100),
    );
    expect(oldSale.transactions[0].price).toBe(2.39);
    const migrated = restoreGame(JSON.parse(JSON.stringify(oldSale)));
    expect(migrated).toMatchObject(oldSale);
    const sold = stateOf(executeSale(migrated, marketProvider.getDay(1), "retailer", 100));
    expect(sold.transactions[0]).toEqual(oldSale.transactions[0]);
    expect(restoreGame(JSON.parse(JSON.stringify(sold)))).toEqual(sold);
  });

  it("keeps the opening benchmark independent of the random card, including wholesale closure", () => {
    const state = createInitialState(marketProvider, { seed: 123 });
    expect(scoreGame(select(state, "strike")).baseline).toBe(scoreGame(state).baseline);
    expect(scoreGame(select(state, "frost")).baseline).toBe(scoreGame(state).baseline);
  });

  it("replays a complete season with a different chosen event every day", () => {
    let state = createInitialState(marketProvider, { seed: 321 });
    for (let day = 1; day <= 7; day++) {
      state = select(state, SCENARIO_EVENTS[day - 1].id);
      const offer = getMarketForGame(state).offers.find((o) => o.capacity > 0)!;
      state = stateOf(executeSale(state, marketProvider.getDay(day), offer.id, 25));
      state = stateOf(advanceDay(state));
      expect(restoreGame(JSON.parse(JSON.stringify(state)))).toEqual(state);
      expect(state.cash).toBeCloseTo(state.grossRevenue - state.sellingCosts - state.storageCosts);
    }
    expect(state.completed).toBe(true);
    expect(state.pricing!.history).toHaveLength(7);
  });
});
