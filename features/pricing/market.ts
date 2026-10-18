import type { MarketDataProvider } from "@/data/market-provider";
import { marketProvider } from "@/data/simulated-provider";
import type { GameState, MarketDay, MarketEvent } from "@/types/game";
import { CROP_PRICING, DEFAULT_MARKET_SEED, PRICE_LIMITS, getCropPricing } from "./config";
import { calculateFinalPrice } from "./pricing";
import { createSeededRandom } from "./random";
import { generateDemand, generateCropMarket } from "./simulation";
import type { DynamicPricingState, MarketSnapshot } from "./types";
import { money } from "@/lib/utils";
import { scenarioMarket } from "@/engine/scenario";

function generateSnapshot(
  day: number,
  freshness: number,
  seed: number,
  previous: MarketSnapshot | undefined,
  provider: MarketDataProvider,
  channelDemandEnabled: boolean,
): MarketSnapshot {
  const random = createSeededRandom((seed ^ Math.imul(day, 0x9e3779b1)) >>> 0);
  const configs = { ...CROP_PRICING, [provider.crop.id]: getCropPricing(provider.crop) };
  return {
    day,
    freshness,
    crops: Object.fromEntries(
      Object.values(configs).map((crop) => [
        crop.id,
        (() => {
          const snapshot = generateCropMarket(crop, previous?.crops[crop.id], random);
          if (channelDemandEnabled) {
            // A separate stream preserves historical market shock rolls.
            const cropHash = [...crop.id].reduce(
              (hash, char) => Math.imul(hash, 31) + char.charCodeAt(0),
              0,
            );
            const demandRandom = createSeededRandom(
              (seed ^ Math.imul(day, 0x85ebca6b) ^ cropHash) >>> 0,
            );
            snapshot.channelDemand = {
              wholesaler: generateDemand(demandRandom),
              retailer: generateDemand(demandRandom),
              restaurant: generateDemand(demandRandom),
            };
          }
          return snapshot;
        })(),
      ]),
    ),
  };
}
export function enableDynamicPricing(
  state: GameState,
  seed = DEFAULT_MARKET_SEED,
  legacyTransactionCount = 0,
  provider: MarketDataProvider = marketProvider,
  demandModel: { version: 1 | 2; startedDay?: number } = { version: 2 },
): GameState {
  if (provider.mode === "live") return state;
  const channelDemandStartedDay = demandModel.startedDay ?? state.day;
  const snapshot = generateSnapshot(
    state.day,
    state.freshness,
    seed,
    undefined,
    provider,
    demandModel.version === 2 && state.day >= channelDemandStartedDay,
  );
  // A migrated season starts from its current original wholesale reference;
  // historical orders and balances remain unchanged.
  if (state.day > 1)
    snapshot.crops[provider.crop.id].marketPrice = Math.min(
      getCropPricing(provider.crop).referencePrice * PRICE_LIMITS.max,
      Math.max(
        getCropPricing(provider.crop).referencePrice * PRICE_LIMITS.min,
        provider.getDay(state.day).offers.find((o) => o.id === "wholesaler")!.price,
      ),
    );
  return {
    ...state,
    pricing: {
      version: demandModel.version,
      ...(demandModel.version === 2 ? { channelDemandStartedDay } : {}),
      seed: seed >>> 0,
      startedDay: state.day,
      legacyTransactionCount,
      history: [snapshot],
    },
  };
}
export function advancePricing(
  pricing: DynamicPricingState,
  day: number,
  freshness: number,
  provider: MarketDataProvider = marketProvider,
): DynamicPricingState {
  const previous = pricing.history.at(-1);
  if (!previous || previous.day + 1 !== day)
    throw new Error("Market days must advance exactly once in order.");
  return {
    ...pricing,
    history: [
      ...pricing.history,
      generateSnapshot(
        day,
        freshness,
        pricing.seed,
        previous,
        provider,
        pricing.version === 2 && day >= (pricing.channelDemandStartedDay ?? pricing.startedDay),
      ),
    ],
  };
}
export function getCurrentCropMarket(state: GameState, cropId = marketProvider.crop.id) {
  return state.pricing?.history.find((snapshot) => snapshot.day === state.day)?.crops[cropId];
}
function eventWithCurrentOffer(event: MarketEvent, offers: MarketDay["offers"]): MarketEvent {
  const offer = (id: string) => offers.find((o) => o.id === id)!;
  const changes: Record<string, Partial<MarketEvent>> = {
    opening: { impact: "Each channel has its own daily demand; compare their net returns" },
    dining: {
      explanation:
        "More diners expand restaurant purchasing capacity. The current price still depends on market movement, crop demand, and freshness.",
      impact: `Restaurant capacity ${offer("restaurant").capacity} kg · offer ${money(offer("restaurant").price)}/kg`,
    },
    harvest: {
      explanation:
        "A larger harvest expands wholesale purchasing capacity. Compare actual quotes and costs before choosing a buyer.",
      headline: "Regional bumper harvest expands wholesale capacity",
      impact: `Wholesale capacity ${offer("wholesaler").capacity} kg · offer ${money(offer("wholesaler").price)}/kg`,
    },
    promotion: {
      explanation:
        "A grocery promotion expands retailer purchasing capacity. Its offer is still calculated from today’s market base, freshness, and crop demand.",
      impact: `Retailer capacity ${offer("retailer").capacity} kg · offer ${money(offer("retailer").price)}/kg`,
    },
    shortage: {
      headline: "Regional supply shortage changes buying plans",
      impact: "Compare today’s demand, freshness, and buyer costs",
      explanation:
        "Supply disruptions affect buying plans. Current offers also reflect simulated market movement, crop demand, and your harvest’s freshness.",
    },
  };
  return { ...event, ...changes[event.id] };
}
/** The sole bridge from the saved simulation and freshness to executable buyer quotes. */
export function priceMarketDay(
  state: GameState,
  rawDay: Readonly<MarketDay>,
  provider: MarketDataProvider = marketProvider,
): Readonly<MarketDay> {
  if (provider.mode === "live") return rawDay;
  if (!state.pricing || rawDay.day < state.pricing.startedDay) return scenarioMarket(state, rawDay);
  const snapshot = state.pricing.history.find((s) => s.day === rawDay.day);
  if (!snapshot) throw new Error("No revealed market snapshot exists for this day.");
  const cropMarket = snapshot.crops[provider.crop.id];
  const crop = getCropPricing(provider.crop);
  const freshness = rawDay.day === state.day ? state.freshness : snapshot.freshness;
  const offers = rawDay.offers.map((offer) => {
    const pricing = calculateFinalPrice({
      crop,
      channel: offer.id,
      marketPrice: cropMarket.marketPrice,
      freshness,
      demand: cropMarket.channelDemand?.[offer.id] ?? cropMarket.demand,
    });
    return { ...offer, price: pricing.finalPrice, pricing };
  });
  const market = scenarioMarket(state, {
    ...rawDay,
    scenarioEventId: undefined,
    offers,
  });
  return {
    ...market,
    events: rawDay.events.map((event) => eventWithCurrentOffer(event, market.offers)),
  };
}
export function getMarketForGame(state: GameState, provider: MarketDataProvider = marketProvider) {
  return priceMarketDay(state, provider.getDay(state.day), provider);
}
export function getMarketHistory(state: GameState, provider: MarketDataProvider = marketProvider) {
  return provider.getHistory(state.day).map((day) => priceMarketDay(state, day, provider));
}
