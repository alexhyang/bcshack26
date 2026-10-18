import type { DynamicPricingState, PriceBreakdown } from "@/features/pricing/types";
export type BuyerId = "wholesaler" | "retailer" | "restaurant";
export type GameView = "dashboard" | "history" | "results";

export interface Crop {
  id: string;
  name: string;
  symbol: string;
  initialInventory: number;
  freshnessSensitivity?: number;
}

export interface BuyerOffer {
  id: BuyerId;
  name: string;
  company: string;
  price: number;
  capacity: number;
  fixedCost: number;
  variableCost: number;
  pricing?: PriceBreakdown;
}

export interface MarketEvent {
  id: string;
  category: "demand" | "supply" | "transport" | "weather";
  headline: string;
  impact: string;
  explanation: string;
  sentiment: "positive" | "negative" | "neutral";
}

export interface MarketDay {
  day: number;
  /** Marks the scenario already applied to these quotes to prevent compounding. */
  scenarioEventId?: string;
  offers: readonly BuyerOffer[];
  events: readonly MarketEvent[];
  storageCostPerKg: number;
  spoilageRate: number;
  freshnessLoss: number;
  weather: string;
  temperature: number;
}

export interface Transaction {
  id: string;
  day: number;
  buyerId: BuyerId;
  buyerName: string;
  quantity: number;
  price: number;
  grossRevenue: number;
  fixedCost: number;
  variableCost: number;
  sellingCosts: number;
  netReturn: number;
  pricing?: PriceBreakdown;
}

export interface DaySummary {
  day: number;
  sold: number;
  held: number;
  spoiled: number;
  storageCosts: number;
  netReturn: number;
  feedback: string;
}

export interface GameState {
  dailyScenarios?: Record<number, { cards: string[]; selected?: string }>;
  scenarioId: string;
  day: number;
  inventory: number;
  freshness: number;
  cash: number;
  grossRevenue: number;
  sellingCosts: number;
  storageCosts: number;
  spoiled: number;
  transactions: Transaction[];
  summaries: DaySummary[];
  completed: boolean;
  pricing?: DynamicPricingState;
}

export interface OrderPreview {
  quantity: number;
  grossRevenue: number;
  sellingCosts: number;
  fixedCost: number;
  variableCost: number;
  netReturn: number;
}

export type GameResult = { ok: true; state: GameState } | { ok: false; error: string };

export interface FinalScore {
  grossRevenue: number;
  sellingCosts: number;
  storageCosts: number;
  netMargin: number;
  sold: number;
  spoiled: number;
  unsold: number;
  wastedOrUnsold: number;
  soldPercent: number;
  baseline: number;
  baselineDifference: number;
  takeaways: string[];
}
