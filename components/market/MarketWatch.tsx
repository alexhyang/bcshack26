import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { marketProvider } from "@/data/simulated-provider";
import { priceMovement } from "@/engine/market";
import type { BuyerId } from "@/types/game";
export const CHANNEL_COLORS: Record<BuyerId, string> = {
  wholesaler: "#60a5fa",
  retailer: "#a78bfa",
  restaurant: "#34d399",
};
export function MarketWatch({ day }: { day: number }) {
  const current = marketProvider.getDay(day);
  const previous = day > 1 ? marketProvider.getDay(day - 1) : undefined;
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
