import type { BuyerOffer, Crop, MarketDay, MarketEvent } from "@/types/game";

export const SCENARIO_ID = "fraser-valley-carrots-v1";
export const GAME_DURATION = 7;
export const CROP: Readonly<Crop> = Object.freeze({
  id: "carrots",
  name: "Carrots",
  symbol: "CRT",
  initialInventory: 1000,
  freshnessSensitivity: 0.5,
});

function offers(
  prices: number[],
  capacities: number[],
  delivery: number[] = [24, 30, 18],
): BuyerOffer[] {
  return [
    {
      id: "wholesaler",
      name: "Wholesaler",
      company: "Valley Produce Co.",
      price: prices[0],
      capacity: capacities[0],
      fixedCost: delivery[0],
      variableCost: 0.12,
    },
    {
      id: "retailer",
      name: "Retailer",
      company: "Maple Market",
      price: prices[1],
      capacity: capacities[1],
      fixedCost: delivery[1],
      variableCost: 0.28,
    },
    {
      id: "restaurant",
      name: "Restaurant",
      company: "Field & Fork",
      price: prices[2],
      capacity: capacities[2],
      fixedCost: delivery[2],
      variableCost: 0.38,
    },
  ];
}

function event(
  id: string,
  category: MarketEvent["category"],
  headline: string,
  impact: string,
  explanation: string,
  sentiment: MarketEvent["sentiment"],
): MarketEvent {
  return { id, category, headline, impact, explanation, sentiment };
}

// Legacy fixed prices are retained to replay existing transactions without repricing them.
// Dynamic seasons replace these prices through features/pricing; capacities, costs,
// and holding rates already include scenario events and are never modified twice.
// Every value here is fictional, not a live market quote.
const scenario: MarketDay[] = [
  {
    day: 1,
    offers: offers([1.12, 1.64, 2.08], [1000, 360, 160]),
    storageCostPerKg: 0.025,
    spoilageRate: 0.02,
    freshnessLoss: 7,
    weather: "Partly cloudy",
    temperature: 18,
    events: [
      event(
        "opening",
        "supply",
        "A fresh harvest hits the market",
        "Balanced demand across all three channels",
        "Compare the return after delivery and handling. The highest price per kg is only part of the story.",
        "neutral",
      ),
    ],
  },
  {
    day: 2,
    offers: offers([1.18, 1.72, 2.65], [950, 320, 240]),
    storageCostPerKg: 0.025,
    spoilageRate: 0.02,
    freshnessLoss: 7,
    weather: "Clear skies",
    temperature: 21,
    events: [
      event(
        "dining",
        "demand",
        "Farm-to-table dining takes off",
        "Restaurant price $2.65/kg · capacity 240 kg",
        "A restaurant demand surge lifts prices, but small buyers still cannot purchase an entire harvest.",
        "positive",
      ),
    ],
  },
  {
    day: 3,
    offers: offers([0.92, 1.48, 2.32], [1100, 280, 180]),
    storageCostPerKg: 0.025,
    spoilageRate: 0.03,
    freshnessLoss: 8,
    weather: "Light rain",
    temperature: 16,
    events: [
      event(
        "harvest",
        "supply",
        "Regional bumper harvest weighs on prices",
        "Wholesale price falls to $0.92/kg",
        "When the market receives more carrots than buyers need, increased supply can push prices down.",
        "negative",
      ),
    ],
  },
  {
    day: 4,
    offers: offers([1.22, 1.8, 2.48], [800, 300, 140], [58, 70, 48]),
    storageCostPerKg: 0.025,
    spoilageRate: 0.025,
    freshnessLoss: 8,
    weather: "Rain showers",
    temperature: 17,
    events: [
      event(
        "highway",
        "transport",
        "Highway closure disrupts deliveries",
        "Delivery costs rise to $58–$70 for large buyers",
        "A higher quoted price may be offset by a longer, more expensive delivery route. Recheck your net return.",
        "negative",
      ),
    ],
  },
  {
    day: 5,
    offers: offers([1.28, 2.12, 2.4], [900, 500, 160]),
    storageCostPerKg: 0.045,
    spoilageRate: 0.08,
    freshnessLoss: 18,
    weather: "Extreme heat",
    temperature: 34,
    events: [
      event(
        "promotion",
        "demand",
        "Maple Market launches a local food promotion",
        "Retailer offers $2.12/kg for up to 500 kg",
        "A grocery retailer promotion increases demand and opens a larger selling opportunity.",
        "positive",
      ),
      event(
        "heat",
        "weather",
        "Extreme heat puts stored crops at risk",
        "Overnight spoilage 8% · storage $0.045/kg",
        "Perishable inventory loses value while you wait. Cooling costs and spoilage both increase in hot weather.",
        "negative",
      ),
    ],
  },
  {
    day: 6,
    offers: offers([1.65, 2.24, 2.86], [950, 340, 200]),
    storageCostPerKg: 0.03,
    spoilageRate: 0.04,
    freshnessLoss: 10,
    weather: "Mostly sunny",
    temperature: 25,
    events: [
      event(
        "shortage",
        "supply",
        "Supply shortage lifts local offers",
        "Wholesale $1.65/kg · restaurant $2.86/kg",
        "Reduced regional supply raises buyer offers. Earlier storage and spoilage expenses still count toward your margin.",
        "positive",
      ),
    ],
  },
  {
    day: 7,
    offers: offers([1.38, 1.98, 2.58], [1200, 420, 220]),
    storageCostPerKg: 0.03,
    spoilageRate: 0.04,
    freshnessLoss: 10,
    weather: "Partly cloudy",
    temperature: 22,
    events: [
      event(
        "closing",
        "demand",
        "Final session: buyers close their books",
        "Sell remaining stock before ending the season",
        "Unsold carrots have no salvage value in this simulation. Opportunity cost matters as the season ends.",
        "neutral",
      ),
    ],
  },
];

// Prevent accidental edits to this read-only scenario, including nested objects.
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
export const SCENARIO: readonly MarketDay[] = deepFreeze(scenario);
