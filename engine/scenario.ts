import type { BuyerId, GameResult, GameState, MarketDay } from "@/types/game";
import { round } from "@/lib/numbers";

export interface ScenarioEvent {
  id: string;
  title: string;
  category: string;
  description: string;

  multipliers: Record<BuyerId, number>;
  closed?: BuyerId;
}

const event = (
  id: string,
  title: string,
  category: string,
  description: string,
  w: number,
  r: number,
  d: number,
  closed?: BuyerId,
): ScenarioEvent => ({
  id,
  title,
  category,
  description,
  multipliers: { wholesaler: w, retailer: r, restaurant: d },
  closed,
});

export const SCENARIO_EVENTS: readonly ScenarioEvent[] = [
  event(
    "peaceful",
    "Today is a peaceful day",
    "No event",
    "No effect on price. All three channels keep today’s base offers.",
    1,
    1,
    1,
  ),
  event(
    "frost",
    "Frost across the valley",
    "Weather",
    "Frost damages competing harvests. Buyers bid more for the smaller supply of fresh produce.",
    1.25,
    1.2,
    1.15,
  ),

  event(
    "rain",
    "Rain washes out the weekend",
    "Weather",
    "Heavy rain keeps diners home. Restaurants cut purchasing while grocery demand edges up.",
    0.95,
    1.08,
    0.75,
  ),

  event(
    "holiday",
    "A surprise public holiday",
    "Government policy",
    "A one-day closure order shuts all restaurants. Families cook at home, lifting grocery demand while wholesale demand softens.",
    0.9,
    1.2,
    0,
    "restaurant",
  ),

  event(
    "strike",
    "Wholesale workers walk out",
    "Labour",
    "Warehouse workers strike for the day. Wholesalers cannot receive produce; retailers and restaurants pay a premium for direct farm deliveries.",
    0,
    1.15,
    1.2,
    "wholesaler",
  ),

  event(
    "festival",
    "The city hosts a food festival",
    "Demand",
    "Restaurants prepare thousands of extra meals. Strong food-service demand also lifts wholesale bids.",
    1.12,
    1.04,
    1.35,
  ),

  event(
    "bumper",
    "A bumper harvest arrives",
    "Supply",
    "Nearby farms bring an unusually large harvest to market. More supply gives every buyer room to negotiate lower prices.",
    0.75,
    0.85,
    0.9,
  ),

  event(
    "imports",
    "Emergency import restrictions",
    "Government policy",
    "An inspection order delays imported vegetables. Local produce become more valuable across the market.",
    1.3,
    1.2,
    1.15,
  ),

  event(
    "school",
    "Schools launch a fresh lunch programme",
    "Government policy",
    "School kitchens place large wholesale orders for healthy lunches, tightening supply for other buyers.",
    1.3,
    1.08,
    1.05,
  ),

  event(
    "heat",
    "A heatwave changes the menu",
    "Weather",
    "Diners favour cold meals and restaurants buy fewer produce. Grocery shoppers still stock up, but overall demand weakens.",
    0.9,
    1.05,
    0.8,
  ),

  event(
    "bridge",
    "The main freight bridge closes",
    "Transport",
    "A bridge closure delays incoming produce. Buyers pay more for locally available stock they can collect today.",
    1.18,
    1.25,
    1.2,
  ),

  event(
    "promotion",
    "Supermarkets promote local crop week",
    "Demand",
    "A grocery campaign drives shoppers to seasonal recipes. Retail buyers compete for extra stock.",
    1.1,
    1.35,
    1.02,
  ),

  event(
    "reopen",
    "Import deliveries resume",
    "Supply",
    "Delayed imported produce floods back into the market. Abundant alternatives push local buying prices down.",
    0.8,
    0.88,
    0.92,
  ),
];

export function dealScenarios(random: () => number = Math.random): string[] {
  const pool = SCENARIO_EVENTS.filter((scenario) => scenario.id !== "peaceful");
  // Each hidden position independently has a 50% chance of no event.
  // Non-peaceful events are sampled without replacement within a hand.
  return Array.from({ length: 3 }, () => {
    if (random() < 0.5) return "peaceful";
    return pool.splice(Math.min(pool.length - 1, Math.floor(random() * pool.length)), 1)[0].id;
  });
}

export function prepareScenario(state: GameState): GameState {
  if (state.completed || state.dailyScenarios?.[state.day]) return state;

  // Preserve original prices for orders already placed in legacy saves.

  if (state.transactions.some((t) => t.day === state.day)) return state;

  return {
    ...state,
    dailyScenarios: { ...state.dailyScenarios, [state.day]: { cards: dealScenarios() } },
  };
}

export function chooseScenario(state: GameState, index: number): GameResult {
  const hand = state.dailyScenarios?.[state.day];

  if (
    state.completed ||
    !hand ||
    hand.selected ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 2
  )
    return { ok: false, error: "Choose one of today's three face-down cards." };

  return {
    ok: true,
    state: {
      ...state,
      dailyScenarios: {
        ...state.dailyScenarios,
        [state.day]: { ...hand, selected: hand.cards[index], selectedIndex: index },
      },
    },
  };
}

export function scenarioPending(state: GameState): boolean {
  const hand = state.dailyScenarios?.[state.day];

  return !!hand && !hand.selected;
}

export function getScenario(state: GameState, day = state.day) {
  return SCENARIO_EVENTS.find((e) => e.id === state.dailyScenarios?.[day]?.selected);
}

export function scenarioMarket(state: GameState, base: Readonly<MarketDay>): Readonly<MarketDay> {
  const selected = getScenario(state, base.day);

  if (!selected || base.scenarioEventId === selected.id) return base;

  return {
    ...base,
    scenarioEventId: selected.id,
    offers: base.offers.map((o) => {
      const multiplier = selected.multipliers[o.id];
      const combinedMultiplier = o.pricing ? o.pricing.combinedMultiplier * multiplier : 0;
      const price = round(
        o.pricing ? o.pricing.marketPrice * combinedMultiplier : o.price * multiplier,
      );
      return {
        ...o,
        price,
        capacity: selected.closed === o.id ? 0 : o.capacity,
        ...(o.pricing
          ? {
              pricing: {
                ...o.pricing,
                scenarioMultiplier: multiplier,
                combinedMultiplier,
                finalPrice: price,
              },
            }
          : {}),
      };
    }),
  };
}

/** Sentiment is from the grower's perspective; mixed cards help some channels and hurt others. */
export function scenarioSentiment(
  scenario: ScenarioEvent,
): "positive" | "negative" | "mixed" | "neutral" {
  const values = Object.entries(scenario.multipliers).map(([buyer, value]) =>
    scenario.closed === buyer ? 0 : value,
  );
  const buffs = values.some((value) => value > 1);
  const nerfs = values.some((value) => value < 1);
  return buffs && nerfs ? "mixed" : buffs ? "positive" : nerfs ? "negative" : "neutral";
}

export const SCENARIO_CHANNEL_REASONS: Record<string, Record<BuyerId, string>> = {
  peaceful: {
    wholesaler: "No event changes wholesale prices.",
    retailer: "No event changes grocery prices.",
    restaurant: "No event changes restaurant prices.",
  },
  frost: {
    wholesaler: "Harvest losses tighten bulk supply.",
    retailer: "Scarcer fresh stock raises grocery bids.",
    restaurant: "Kitchens compete for fewer local produce.",
  },
  rain: {
    wholesaler: "Weaker dining demand reduces bulk orders.",
    retailer: "More families cook at home.",
    restaurant: "Rain keeps diners away.",
  },
  holiday: {
    wholesaler: "Restaurant closures reduce bulk demand.",
    retailer: "Home cooking lifts grocery demand.",
    restaurant: "The closure order stops all restaurant buying.",
  },
  strike: {
    wholesaler: "Striking warehouse staff cannot receive deliveries.",
    retailer: "Stores pay extra for direct farm supply.",
    restaurant: "Kitchens pay extra to bypass wholesalers.",
  },
  festival: {
    wholesaler: "Festival orders lift bulk demand.",
    retailer: "Extra visitors lift grocery sales slightly.",
    restaurant: "Festival meals drive a surge in produce orders.",
  },
  bumper: {
    wholesaler: "A flood of bulk supply lowers bids.",
    retailer: "Stores have more farms to buy from.",
    restaurant: "Abundant produce give kitchens cheaper options.",
  },
  imports: {
    wholesaler: "Delayed imports tighten bulk supply.",
    retailer: "Stores compete for local alternatives.",
    restaurant: "Kitchens pay more to replace imports.",
  },
  school: {
    wholesaler: "Large school contracts increase bulk demand.",
    retailer: "School orders leave less stock for stores.",
    restaurant: "Tighter local supply nudges kitchen bids up.",
  },
  heat: {
    wholesaler: "Lower overall demand softens bulk bids.",
    retailer: "Households continue stocking groceries.",
    restaurant: "Lighter summer menus use fewer produce.",
  },
  bridge: {
    wholesaler: "Delayed freight tightens incoming supply.",
    retailer: "Stores pay more for available local stock.",
    restaurant: "Kitchens bid up produce available today.",
  },
  promotion: {
    wholesaler: "Store restocking lifts bulk demand.",
    retailer: "Produce promotions drive a surge in sales.",
    restaurant: "Competition for stock nudges bids up slightly.",
  },
  reopen: {
    wholesaler: "Returning imports flood the bulk market.",
    retailer: "More imported alternatives lower store bids.",
    restaurant: "Cheaper alternatives reduce kitchen bids.",
  },
};
