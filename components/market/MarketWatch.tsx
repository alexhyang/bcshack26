import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { getMarketForGame, getMarketHistory } from "@/features/pricing/market";
import { priceMovement } from "@/engine/market";
import type { BuyerId, GameState } from "@/types/game";
export const CHANNEL_COLORS: Record<BuyerId, string> = {
  wholesaler: "var(--channel-wholesaler)",
  retailer: "var(--channel-retailer)",
  restaurant: "var(--channel-restaurant)",
};
export function MarketWatch({ game }: { game: GameState }) {
  const current = getMarketForGame(game);
  const previous = getMarketHistory(game).at(-2);
  return (
    <div className="market-watch">
      {current.offers.map((offer, index) => {
        const change = priceMovement(offer.price, previous?.offers[index].price);
        return (
          <div key={offer.id}>
            <div className="quote-name">
              <span className="channel-dot" style={{ background: CHANNEL_COLORS[offer.id] }} />
              {offer.name}
            </div>
            <div className="quote-value">
              ${offer.price.toFixed(2)}
              <span className={change >= 0 ? "positive" : "negative"}>
                {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {Math.abs(change).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
