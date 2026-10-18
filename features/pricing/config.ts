import { EXTRA_CROP_PRICING } from "@/data/crops";
import type { BuyerId, Crop } from "@/types/game";
import type { CropPricingConfig, DemandBucket } from "./types";

export const CHANNEL_PARAMETERS: Readonly<
  Record<BuyerId, { multiplier: number; freshnessPenalty: number }>
> = {
  restaurant: { multiplier: 1.35, freshnessPenalty: 2.2 },
  retailer: { multiplier: 1.14, freshnessPenalty: 1.25 },
  wholesaler: { multiplier: 1, freshnessPenalty: 0.25 },
};
export const DEMAND_PARAMETERS: readonly {
  value: DemandBucket;
  weight: number;
  multiplier: number;
}[] = [
  { value: "high", weight: 0.25, multiplier: 1.2 },
  { value: "medium", weight: 0.5, multiplier: 1 },
  { value: "low", weight: 0.25, multiplier: 0.85 },
];
export const PRICE_LIMITS = { min: 0.6, max: 1.6 } as const;
export const DEFAULT_MARKET_SEED = 20261017;
/** Reference prices are fictional CAD/kg; carrots retain the original opening wholesale price. */
export const CROP_PRICING: Readonly<Record<string, CropPricingConfig>> = {
  carrots: {
    id: "carrots",
    name: "Carrots",
    symbol: "CRT",
    referencePrice: 1.12,
    freshnessSensitivity: 0.5,
    shockProbability: 0.25,
    shockMin: 0.02,
    shockMax: 0.06,
  },
  lettuce: {
    id: "lettuce",
    name: "Lettuce",
    symbol: "LTC",
    referencePrice: 3,
    freshnessSensitivity: 1,
    shockProbability: 0.55,
    shockMin: 0.04,
    shockMax: 0.12,
  },
  tomatoes: {
    id: "tomatoes",
    name: "Tomatoes",
    symbol: "TMT",
    referencePrice: 3.4,
    freshnessSensitivity: 0.75,
    shockProbability: 0.4,
    shockMin: 0.03,
    shockMax: 0.09,
  },
  strawberries: {
    id: "strawberries",
    name: "Strawberries",
    symbol: "STB",
    referencePrice: 5,
    freshnessSensitivity: 1.15,
    shockProbability: 0.65,
    shockMin: 0.05,
    shockMax: 0.15,
  },
  potatoes: {
    id: "potatoes",
    name: "Potatoes",
    symbol: "POT",
    referencePrice: 0.9,
    freshnessSensitivity: 0.3,
    shockProbability: 0.15,
    shockMin: 0.01,
    shockMax: 0.04,
  },
  ...EXTRA_CROP_PRICING,
};
export function getCropPricing(
  crop: Pick<Crop, "id" | "name" | "symbol" | "freshnessSensitivity">,
): CropPricingConfig {
  const configured = CROP_PRICING[crop.id];
  if (configured)
    return {
      ...configured,
      freshnessSensitivity: crop.freshnessSensitivity ?? configured.freshnessSensitivity,
    };
  return {
    id: crop.id,
    name: crop.name,
    symbol: crop.symbol,
    referencePrice: 1,
    freshnessSensitivity: crop.freshnessSensitivity ?? 0.65,
    shockProbability: 0.3,
    shockMin: 0.02,
    shockMax: 0.07,
  };
}
