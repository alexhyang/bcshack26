import type { MarketDay } from "@/types/game";
import { round } from "./trading";

export function holdOvernight(inventory: number, freshness: number, day: Readonly<MarketDay>) {
  const storageCosts = round(inventory * day.storageCostPerKg);
  const spoiled = round(inventory * day.spoilageRate);
  return {
    inventory: round(inventory - spoiled),
    storageCosts,
    spoiled,
    freshness: Math.max(0, freshness - day.freshnessLoss),
  };
}
