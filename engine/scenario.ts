import type { BuyerId, GameResult, GameState, MarketDay } from "@/types/game";

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
    "frost",
    "Frost across the valley",
    "Weather",
    "Frost damages competing harvests. Buyers bid more for the smaller supply of fresh carrots.",
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
    "An inspection order delays imported vegetables. Local carrots become more valuable across the market.",
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
    "Diners favour cold meals and restaurants buy fewer carrots. Grocery shoppers still stock up, but overall demand weakens.",
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
    "Supermarkets promote carrot week",
    "Demand",
    "A grocery campaign drives shoppers to carrot recipes. Retail buyers compete for extra stock.",
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
  const pool = [...SCENARIO_EVENTS];

  return Array.from(
    { length: 3 },
    () => pool.splice(Math.min(pool.length - 1, Math.floor(random() * pool.length)), 1)[0].id,
  );
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
        [state.day]: { ...hand, selected: hand.cards[index] },
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

  if (!selected) return base;

  return {
    ...base,
    offers: base.offers.map((o) => ({
      ...o,
      price: Math.round(o.price * selected.multipliers[o.id] * 100) / 100,
      capacity: selected.closed === o.id ? 0 : o.capacity,
    })),
  };
}
