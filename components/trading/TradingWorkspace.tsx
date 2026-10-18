"use client";
import { useState } from "react";
import type { BuyerId, GameState } from "@/types/game";
import { PriceChart } from "@/components/market/PriceChart";
import { BuyerOffers } from "@/components/market/BuyerOffers";
import { SellPanel } from "./SellPanel";
import { TradeHistory } from "./TradeHistory";

/** Mounted per crop/day/season so quantities and sale feedback cannot leak between contexts. */
export function TradingWorkspace({
  game,
  onViewHistory,
}: {
  game: GameState;
  onViewHistory: () => void;
}) {
  const [selected, setSelected] = useState<BuyerId>("wholesaler");
  const [quantity, setQuantity] = useState(() => String(Math.min(100, game.inventory) || 100));
  return (
    <div className="market-column">
      <div className="market-top-row">
        <PriceChart game={game} />
        <SellPanel
          key={selected}
          game={game}
          selected={selected}
          onSelect={setSelected}
          quantity={quantity}
          onQuantityChange={setQuantity}
        />
      </div>
      <BuyerOffers
        game={game}
        selected={selected}
        onSelect={setSelected}
        quantity={Number(quantity)}
      />
      <TradeHistory game={game} compact onViewAll={onViewHistory} />
    </div>
  );
}
