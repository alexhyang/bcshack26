import type { BuyerId } from "@/types/game";
export type DemandBucket = "high" | "medium" | "low";
export type RandomSource = () => number;
export interface CropPricingConfig {
  id: string;
  name: string;
  symbol: string;
  referencePrice: number;
  freshnessSensitivity: number;
  shockProbability: number;
  shockMin: number;
  shockMax: number;
}
export interface PriceBreakdown {
  cropId: string;
  channel: BuyerId;
  marketPrice: number;
  freshness: number;
  demand: DemandBucket;
  channelMultiplier: number;
  freshnessMultiplier: number;
  demandMultiplier: number;
  combinedMultiplier: number;
  finalPrice: number;
}
export interface CropMarketSnapshot {
  cropId: string;
  marketPrice: number;
  demand: DemandBucket;
  changePercent: number;
  shockOccurred: boolean;
  shockMagnitude: number;
}
export interface MarketSnapshot {
  day: number;
  /** Historical observation only. Current pricing always uses GameState.freshness. */
  freshness: number;
  crops: Record<string, CropMarketSnapshot>;
}
export interface DynamicPricingState {
  version: 1;
  seed: number;
  startedDay: number;
  /** Preserve these already executed orders at the original scenario's prices. */
  legacyTransactionCount: number;
  history: MarketSnapshot[];
}
