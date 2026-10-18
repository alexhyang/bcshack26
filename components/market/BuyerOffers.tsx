"use client";
import {
  Warehouse,
  ShoppingBasket,
  UtensilsCrossed,
  ArrowUpRight,
  Check,
  Truck,
} from "lucide-react";
import { compareBuyerReturns } from "@/engine/comparison";
import { tradeIsForActiveCrop } from "@/engine/portfolio";
import { getGameCrop } from "@/data/crops";
import type { BuyerId, GameState } from "@/types/game";
import { getMarketForGame } from "@/features/pricing/market";
import { DemandBadge, PriceBreakdown } from "@/features/pricing/components/PriceBreakdown";
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
  quantity,
}: {
  game: GameState;
  selected: BuyerId;
  onSelect: (id: BuyerId) => void;
  quantity: number;
}) {
  const market = getMarketForGame(game);
  const comparison = compareBuyerReturns(game, market, quantity);
  const bestNames = comparison.rows
    .filter((row) => comparison.bestBuyerIds.includes(row.offer.id))
    .map((row) => row.offer.name)
    .join(" and ");
  const validQuantity = Number.isFinite(quantity) && quantity > 0;
  const allLoseMoney = comparison.bestNetReturn !== null && comparison.bestNetReturn < 0;
  let summary = "Enter a valid quantity in the sell order to compare buyers.";
  if (validQuantity && comparison.bestNetReturn === null)
    summary = "No buyer can accept this order. Check the reasons below or adjust your quantity.";
  if (comparison.bestNetReturn !== null) {
    if (allLoseMoney)
      summary = `All available orders lose money. ${bestNames} ${comparison.bestBuyerIds.length > 1 ? "tie for the lowest loss" : "has the lowest loss"}: ${money(Math.abs(comparison.bestNetReturn))}. Try a different quantity or hold your stock.`;
    else if (comparison.bestBuyerIds.length > 1)
      summary = `${bestNames} tie at ${money(comparison.bestNetReturn)} after selling costs.`;
    else if (comparison.advantage !== null)
      summary = `${bestNames} returns ${money(comparison.bestNetReturn)} after selling costs — ${money(comparison.advantage)} more than the next available buyer.`;
    else
      summary = `${bestNames} is the only buyer available for this quantity, returning ${money(comparison.bestNetReturn)} after selling costs.`;
  }
  return (
    <section className="buyers-section" data-tour="buyer-offers">
      <div className="section-heading">
        <h2>Today’s buyer offers · {getGameCrop(game).name}</h2>
        <span className="subtle-label">One order per crop / buyer / day</span>
      </div>
      <PriceBreakdown game={game} />
      <div className="buyer-comparison-heading">
        <strong>Compare net returns{validQuantity ? ` · ${kg(quantity)} kg per buyer` : ""}</strong>
        <p>
          Uses the quantity in your sell order. Delivery and handling are deducted; each option is a
          separate order.
        </p>
      </div>
      <p className={`buyer-comparison-summary ${allLoseMoney ? "negative" : ""}`} role="status">
        {summary}
      </p>
      <div className="buyer-grid">
        {comparison.rows.map(({ offer, preview, error }) => {
          const Icon = BUYER_ICONS[offer.id];
          const traded = game.transactions.some(
            (t) => t.day === game.day && t.buyerId === offer.id && tradeIsForActiveCrop(game, t),
          );
          const best = comparison.bestBuyerIds.includes(offer.id);
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
                ) : best ? (
                  <span className={`offer-tag ${allLoseMoney ? "negative" : "positive"}`}>
                    {allLoseMoney
                      ? "Lowest loss"
                      : comparison.bestBuyerIds.length > 1
                        ? "Joint best return"
                        : "Best net return"}
                  </span>
                ) : (
                  <ArrowUpRight size={15} className="text-slate-600" />
                )}
              </div>
              <h3>{offer.name}</h3>
              <p>{offer.company}</p>
              {offer.pricing && <DemandBadge demand={offer.pricing.demand} />}
              <div className="buyer-price">
                ${offer.price.toFixed(2)}
                <span>/ kg</span>
              </div>
              <div className="buyer-capacity">
                <span>Capacity</span>

                <strong>
                  {offer.capacity === 0
                    ? "Closed today"
                    : traded
                      ? "Order filled"
                      : `${kg(offer.capacity)} kg`}
                </strong>
              </div>
              <div className="buyer-delivery">
                <Truck size={11} />${offer.fixedCost} + ${offer.variableCost.toFixed(2)}/kg
              </div>
              {preview ? (
                <div className="buyer-return-breakdown">
                  <div>
                    <span>Revenue</span>
                    <span>{money(preview.grossRevenue)}</span>
                  </div>
                  <div>
                    <span>Selling costs</span>
                    <span>−{money(preview.sellingCosts)}</span>
                  </div>
                  <div className="buyer-return-total">
                    <span>Net for {kg(quantity)} kg</span>
                    <strong className={preview.netReturn < 0 ? "negative" : "positive"}>
                      {money(preview.netReturn)}
                    </strong>
                  </div>
                  <small>{money(preview.netReturn / quantity)}/kg after selling costs</small>
                </div>
              ) : (
                <div className="buyer-return-unavailable">{error}</div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
