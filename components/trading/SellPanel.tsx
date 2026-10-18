"use client";
import { useState } from "react";
import { ArrowUpRight, CheckCircle2, Info, Package, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketForGame } from "@/features/pricing/market";
import { previewOrder, validateOrder } from "@/engine/trading";
import { useGameStore } from "@/store/gameStore";
import { tradeIsForActiveCrop } from "@/engine/portfolio";
import { getGameCrop } from "@/data/crops";
import type { BuyerId, GameState } from "@/types/game";
import { kg, money } from "@/lib/utils";
import { BUYER_ICONS } from "@/components/market/BuyerOffers";
export function SellPanel({
  game,
  selected,
  onSelect,
  quantity,
  onQuantityChange,
}: {
  game: GameState;
  selected: BuyerId;
  onSelect: (id: BuyerId) => void;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
}) {
  const market = getMarketForGame(game);
  const offer = market.offers.find((o) => o.id === selected)!;
  const sell = useGameStore((state) => state.sell);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);
  const filled = game.transactions.some(
    (t) => t.day === game.day && t.buyerId === selected && tradeIsForActiveCrop(game, t),
  );
  const max = filled ? 0 : Math.min(offer.capacity, game.inventory);
  const amount = Number(quantity);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const preview = validAmount ? previewOrder(offer, amount) : null;
  const validation = validateOrder(game, market, selected, amount);
  const Icon = BUYER_ICONS[selected];
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = sell(selected, amount);
    setMessage({
      error: !result.ok,
      text: result.ok
        ? `Sold ${kg(amount)} kg of ${getGameCrop(game).name.toLowerCase()} to ${offer.name}. Cash ${preview!.netReturn < 0 ? "decreased" : "increased"} by ${money(Math.abs(preview!.netReturn))}.`
        : result.error,
    });
  }
  return (
    <section className="panel order-panel" id="sell-order">
      <div className="panel-heading">
        <h2>Place a sell order</h2>
        <span className="live-label">
          <span className="status-dot" />
          {game.completed ? "CLOSED" : "MARKET OPEN"}
        </span>
      </div>
      <form onSubmit={submit} noValidate>
        <div className="order-layout">
          <div className="order-inputs" data-tour="order-inputs">
            <label className="field-label" htmlFor="buyer">
              Selling channel
            </label>
            <div className="select-wrap">
              <Icon size={16} />
              <select
                id="buyer"
                value={selected}
                onChange={(e) => {
                  onSelect(e.target.value as BuyerId);
                  setMessage(null);
                }}
              >
                {market.offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} · {o.company}
                  </option>
                ))}
              </select>
            </div>
            <div className="quantity-label">
              <label className="field-label" htmlFor="quantity">
                Quantity to sell
              </label>
              <span>{kg(max)} kg available</span>
            </div>
            <div className="quantity-input">
              <input
                id="quantity"
                type="number"
                min="0.01"
                max={max}
                step="0.01"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => {
                  onQuantityChange(e.target.value);
                  setMessage(null);
                }}
                aria-describedby="order-validation"
              />
              <span>kg</span>
              <button
                type="button"
                onClick={() => {
                  onQuantityChange(String(max));
                  setMessage(null);
                }}
                disabled={max === 0}
              >
                MAX
              </button>
            </div>
            <div className="quantity-presets">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  type="button"
                  key={percent}
                  disabled={max === 0}
                  onClick={() => {
                    onQuantityChange(String(Math.floor(max * percent) / 100));
                    setMessage(null);
                  }}
                >
                  {percent}%
                </button>
              ))}
            </div>
            <div className="order-hint">
              <Package size={12} />
              {kg(game.inventory)} kg of {getGameCrop(game).name.toLowerCase()} available
            </div>
          </div>
          <div className="order-preview" data-tour="order-preview">
            <div className="preview-row">
              <span>Price per kg</span>
              <span>{money(offer.price)}</span>
            </div>
            <div className="preview-row">
              <span>Gross revenue</span>
              <span>{money(preview?.grossRevenue ?? 0)}</span>
            </div>
            <div className="preview-row">
              <span>Fixed delivery</span>
              <span>{preview ? `−${money(preview.fixedCost)}` : "—"}</span>
            </div>
            <div className="preview-row">
              <span>Handling & packaging</span>
              <span>{preview ? `−${money(preview.variableCost)}` : "—"}</span>
            </div>
            <div className="net-preview">
              <div>
                <span>Estimated net return</span>
                <small>After all selling costs</small>
              </div>
              <strong className={(preview?.netReturn ?? 0) >= 0 ? "positive" : "negative"}>
                {money(preview?.netReturn ?? 0)}
              </strong>
            </div>
          </div>
        </div>
        <div id="order-validation" aria-live="polite">
          {message ? (
            <div
              role={message.error ? "alert" : "status"}
              className={`order-message ${message.error ? "error" : "success"}`}
            >
              {message.error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
              {message.text}
            </div>
          ) : (
            validation && (
              <div className="order-message error">
                <AlertCircle size={14} />
                {validation}
              </div>
            )
          )}
        </div>
        {preview && preview.netReturn < 0 && !validation && (
          <div className="order-message error">
            <Info size={14} />
            Delivery and handling exceed revenue. This order will reduce your cash.
          </div>
        )}
        <div className="order-bottom">
          <span>
            <ShieldCheck size={13} />
            Simulated trade · No real money
          </span>
          <Button type="submit" disabled={!!validation}>
            Confirm sale <ArrowUpRight size={16} />
          </Button>
        </div>
      </form>
    </section>
  );
}
