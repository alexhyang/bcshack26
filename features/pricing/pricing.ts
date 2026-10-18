import type { BuyerId } from "@/types/game";
import { round } from "@/lib/numbers";
import { CHANNEL_PARAMETERS, DEMAND_PARAMETERS } from "./config";
import type { CropPricingConfig, DemandBucket, PriceBreakdown } from "./types";

const nonnegative = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0);
export function calculateFreshnessMultiplier(
  freshness: number,
  channelPenalty: number,
  cropSensitivity: number,
): number {
  const ratio = Math.min(100, nonnegative(freshness)) / 100;
  return (
    ratio *
    Math.max(0, 1 - nonnegative(channelPenalty) * nonnegative(cropSensitivity) * (1 - ratio))
  );
}
export function calculateFinalPrice({
  crop,
  channel,
  marketPrice,
  freshness,
  demand,
}: {
  crop: CropPricingConfig;
  channel: BuyerId;
  marketPrice: number;
  freshness: number;
  demand: DemandBucket;
}): PriceBreakdown {
  const parameters = CHANNEL_PARAMETERS[channel];
  const channelMultiplier = parameters.multiplier;
  const freshnessMultiplier = calculateFreshnessMultiplier(
    freshness,
    parameters.freshnessPenalty,
    crop.freshnessSensitivity,
  );
  const demandMultiplier =
    DEMAND_PARAMETERS.find((bucket) => bucket.value === demand)?.multiplier ?? 1;
  const combinedMultiplier = nonnegative(
    channelMultiplier * freshnessMultiplier * demandMultiplier,
  );
  return {
    cropId: crop.id,
    channel,
    marketPrice: nonnegative(marketPrice),
    freshness: Math.min(100, nonnegative(freshness)),
    demand,
    channelMultiplier,
    freshnessMultiplier,
    demandMultiplier,
    combinedMultiplier,
    finalPrice: round(nonnegative(nonnegative(marketPrice) * combinedMultiplier)),
  };
}
export function compareBuyerOffers(
  input: Omit<Parameters<typeof calculateFinalPrice>[0], "channel">,
): PriceBreakdown[] {
  return (["restaurant", "retailer", "wholesaler"] as const).map((channel) =>
    calculateFinalPrice({ ...input, channel }),
  );
}
