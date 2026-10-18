import { inventoryItems, totalInventory, initialInventory } from "./portfolio";
import type { GameState, FinalScore } from "@/types/game";
import type { MarketDataProvider } from "@/data/market-provider";
import { marketProvider } from "@/data/simulated-provider";
import { previewOrder, round } from "./trading";
import { priceMarketDay } from "@/features/pricing/market";

export function scoreGame(
  state: GameState,
  provider: MarketDataProvider = marketProvider,
): FinalScore {
  const sold = round(state.transactions.reduce((sum, t) => sum + t.quantity, 0));
  const baseline = round(
    inventoryItems(state).reduce((sum, item) => {
      const opening =
        state.pricing && state.pricing.legacyTransactionCount === 0
          ? priceMarketDay(
              {
                ...state,
                activeCropId: state.cropInventory ? item.cropId : undefined,
                freshness: 100,
                dailyScenarios: undefined,
              },
              provider.getDay(1),
              provider,
            )
          : provider.getDay(1);
      const wholesale = opening.offers.find((offer) => offer.id === "wholesaler")!;
      return sum + previewOrder(wholesale, item.initialInventory).netReturn;
    }, 0),
  );
  const remaining = totalInventory(state);
  const netMargin = round(state.grossRevenue - state.sellingCosts - state.storageCosts);
  const baselineDifference = round(netMargin - baseline);
  const channels = new Set(state.transactions.map((t) => t.buyerId)).size;
  const takeaways = [
    baselineDifference >= 0
      ? `Your selling strategy earned $${baselineDifference.toFixed(2)} more than selling everything to the Day 1 wholesaler. Timing and channel choice paid off.`
      : `Your selling margin was $${Math.abs(baselineDifference).toFixed(2)} below the Day 1 baseline. Compare each buyer's net return before deciding to hold.`,
    state.spoiled > 0
      ? `Holding cost $${state.storageCosts.toFixed(2)} in storage and ${state.spoiled} kg in spoilage. Higher later prices must offset both losses.`
      : "You avoided spoilage. Selling early protects the harvest, although it gives up the opportunity to benefit from later demand.",
    remaining > 0
      ? `${remaining} kg remained unsold. A lower-price, high-capacity buyer can be valuable when the season is about to end.`
      : channels > 1
        ? "You used multiple selling channels. Balancing buyer capacity against delivery costs can outperform chasing the highest quoted price."
        : "Buyer capacity and fixed delivery costs matter. Compare a large wholesale order with several smaller, higher-price orders next season.",
  ];
  return {
    grossRevenue: state.grossRevenue,
    sellingCosts: state.sellingCosts,
    storageCosts: state.storageCosts,
    netMargin,
    sold,
    spoiled: state.spoiled,
    unsold: remaining,
    wastedOrUnsold: round(state.spoiled + remaining),
    soldPercent: initialInventory(state) > 0 ? round((sold / initialInventory(state)) * 100) : 0,
    baseline,
    baselineDifference,
    takeaways,
  };
}
