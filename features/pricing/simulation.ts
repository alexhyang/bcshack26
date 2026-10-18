import { DEMAND_PARAMETERS, PRICE_LIMITS } from "./config";
import { randomUnit, weightedRandom } from "./random";
import type { CropMarketSnapshot, CropPricingConfig, RandomSource } from "./types";

export function generateDemand(random: RandomSource) {
  return weightedRandom(DEMAND_PARAMETERS, random);
}
export function generatePriceShock(
  previousPrice: number,
  crop: CropPricingConfig,
  random: RandomSource,
) {
  const reference = Number.isFinite(crop.referencePrice) ? Math.max(0, crop.referencePrice) : 0;
  const clamp = (value: number) =>
    Math.min(
      reference * PRICE_LIMITS.max,
      Math.max(reference * PRICE_LIMITS.min, Number.isFinite(value) ? value : reference),
    );
  const previous = clamp(previousPrice);
  const shockOccurred = randomUnit(random) < crop.shockProbability;
  let shockMagnitude = 0;
  let marketPrice = previous;
  if (shockOccurred) {
    const direction = randomUnit(random) < 0.5 ? -1 : 1;
    shockMagnitude = crop.shockMin + randomUnit(random) * (crop.shockMax - crop.shockMin);
    marketPrice = clamp(previous * (1 + direction * shockMagnitude));
  }
  return {
    marketPrice,
    shockOccurred,
    shockMagnitude,
    changePercent: previous > 0 ? (marketPrice / previous - 1) * 100 : 0,
  };
}
export function generateCropMarket(
  crop: CropPricingConfig,
  previous: CropMarketSnapshot | undefined,
  random: RandomSource,
): CropMarketSnapshot {
  const demand = generateDemand(random);
  const price = previous
    ? generatePriceShock(previous.marketPrice, crop, random)
    : {
        marketPrice: crop.referencePrice,
        shockOccurred: false,
        shockMagnitude: 0,
        changePercent: 0,
      };
  return { cropId: crop.id, demand, ...price };
}
