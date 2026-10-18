import { previewOrder, round, validateOrder } from "./trading";
import type { GameState, MarketDay } from "@/types/game";

/** Compare executable orders at exactly the same quantity, without clipping to capacity. */
export function compareBuyerReturns(
  state: GameState,
  market: Readonly<MarketDay>,
  quantity: number,
) {
  const rows = market.offers.map((offer) => {
    const error = validateOrder(state, market, offer.id, quantity);
    return { offer, error, preview: error ? null : previewOrder(offer, quantity) };
  });
  const ranked = rows
    .filter((row) => row.preview !== null)
    .sort((a, b) => b.preview!.netReturn - a.preview!.netReturn);
  const bestNetReturn = ranked[0]?.preview?.netReturn ?? null;
  return {
    rows,
    bestNetReturn,
    bestBuyerIds: ranked
      .filter((row) => row.preview!.netReturn === bestNetReturn)
      .map((row) => row.offer.id),
    advantage:
      ranked.length > 1 ? round(ranked[0].preview!.netReturn - ranked[1].preview!.netReturn) : null,
  };
}
