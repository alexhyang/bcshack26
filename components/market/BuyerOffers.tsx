"use client";
import {
  Warehouse,
  ShoppingBasket,
  UtensilsCrossed,
  ArrowUpRight,
  Check,
  Truck,
} from "lucide-react";
import type { BuyerId, GameState } from "@/types/game";
import { getMarketForGame } from "@/features/pricing/market";
import { PriceBreakdown } from "@/features/pricing/components/PriceBreakdown";
import { previewOrder } from "@/engine/trading";
import { kg, money } from "@/lib/utils";
import { CHANNEL_COLORS } from "./MarketWatch";
export const BUYER_ICONS = {
  wholesaler: Warehouse,
  retailer: ShoppingBasket,
  restaurant: UtensilsCrossed,
};
export function BuyerOffers({
  game,
  selected,
  onSelect,
}: {
  game: GameState;
  selected: BuyerId;
  onSelect: (id: BuyerId) => void;
}) {
  const market = getMarketForGame(game);
  const best = [...market.offers]
    .filter(
      (o) =>
        !game.transactions.some((t) => t.day === game.day && t.buyerId === o.id) &&
        game.inventory > 0,
    )
    .sort((a, b) => {
      const qA = Math.min(a.capacity, game.inventory),
        qB = Math.min(b.capacity, game.inventory);
      return previewOrder(b, qB).netReturn / qB - previewOrder(a, qA).netReturn / qA;
    })[0]?.id;
  return (
    <section className="buyers-section" data-tour="buyer-offers">
      <div className="section-heading">
        <h2>Today’s buyer offers</h2>
        <span className="subtle-label">One order per buyer / day</span>
      </div>
      <PriceBreakdown game={game} />
      <div className="buyer-grid">
        {market.offers.map((offer) => {
          const Icon = BUYER_ICONS[offer.id];
          const traded = game.transactions.some(
            (t) => t.day === game.day && t.buyerId === offer.id,
          );
          const max = Math.min(game.inventory, offer.capacity);
          const net = max > 0 ? previewOrder(offer, max).netReturn / max : 0;
          return (
            <button
              key={offer.id}
              className={`buyer-card ${selected === offer.id ? "selected" : ""} ${traded ? "filled" : ""}`}
              onClick={() => onSelect(offer.id)}
              aria-pressed={selected === offer.id}
            >
              <div className="buyer-card-top">
                <span className="buyer-icon" style={{ color: CHANNEL_COLORS[offer.id] }}>
                  <Icon size={17} />
                </span>
                {traded ? (
                  <span className="offer-tag">
                    <Check size={11} />
                    Filled
                  </span>
                ) : best === offer.id ? (
                  <span className="offer-tag positive">Best net / kg</span>
                ) : (
                  <ArrowUpRight size={15} className="text-slate-600" />
                )}
              </div>
              <h3>{offer.name}</h3>
              <p>{offer.company}</p>
              <div className="buyer-price">
                ${offer.price.toFixed(2)}
                <span>/ kg</span>
              </div>
              <div className="buyer-capacity">
                <span>Capacity</span>
                <strong>{traded ? "Order filled" : `${kg(offer.capacity)} kg`}</strong>
              </div>
              <div className="buyer-delivery">
                <Truck size={11} />${offer.fixedCost} + ${offer.variableCost.toFixed(2)}/kg
              </div>
              <div className="buyer-net">
                {traded
                  ? "Available again next day"
                  : max > 0
                    ? `${money(net)}/kg net at ${kg(max)} kg`
                    : "No inventory remaining"}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
