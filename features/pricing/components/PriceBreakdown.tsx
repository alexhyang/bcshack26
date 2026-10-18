"use client";
import { Calculator, ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { getGameCrop } from "@/data/crops";
import { scenarioPending } from "@/engine/scenario";
import { CROP_PRICING, getCropPricing } from "../config";
import { getCurrentCropMarket, getMarketForGame } from "../market";
import type { DemandBucket } from "../types";
import type { GameState } from "@/types/game";
import { money } from "@/lib/utils";
import "../pricing.css";

export function DemandBadge({ demand }: { demand: DemandBucket }) {
  return <span className={`demand-badge demand-${demand}`}>{demand.toUpperCase()} DEMAND</span>;
}
export function MarketMovement({ change }: { change: number }) {
  return (
    <span className={`pricing-movement ${change > 0 ? "positive" : change < 0 ? "negative" : ""}`}>
      {change > 0 ? <ArrowUpRight size={12} /> : change < 0 ? <ArrowDownRight size={12} /> : null}
      {change > 0 ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}
export function PriceBreakdown({ game }: { game: GameState }) {
  const current = getCurrentCropMarket(game);
  if (!current) return null;
  const crop = getCropPricing(getGameCrop(game));
  const market = getMarketForGame(game);
  const offers = (["restaurant", "retailer", "wholesaler"] as const).map((channel) => {
    const offer = market.offers.find((o) => o.id === channel)!;
    return { ...offer.pricing!, capacity: offer.capacity };
  });
  const highest = Math.max(
    ...offers.filter((offer) => offer.capacity > 0).map((offer) => offer.finalPrice),
  );
  const rows = [
    { name: "Channel", key: "channelMultiplier" },
    { name: "Freshness", key: "freshnessMultiplier" },
    { name: "Demand", key: "demandMultiplier" },
    { name: "Daily scenario", key: "scenarioMultiplier" },
    { name: "Combined", key: "combinedMultiplier" },
  ] as const;
  const snapshots = game.pricing!.history.at(-1)!;
  return (
    <div className="pricing-feature">
      <div className="pricing-market-strip">
        <div>
          <span className="pricing-market-label">MARKET BASE</span>
          <strong>
            {money(current.marketPrice)}
            <small>/ kg</small>
          </strong>
          <MarketMovement change={current.changePercent} />
        </div>
        <span className="channel-demand-label">Demand varies by channel</span>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Calculator size={13} />
              Show Price Breakdown
            </Button>
          </DialogTrigger>
          <DialogContent className="price-breakdown-dialog">
            <DialogTitle className="text-xl font-semibold">
              What drives your selling price?
            </DialogTitle>
            <DialogDescription className="mt-2 text-xs leading-6 text-slate-400">
              Market price × channel × freshness × demand × daily scenario. These are today’s
              executable simulated offers, before delivery and handling costs.
              {scenarioPending(game) &&
                " Reveal today’s scenario card to finalize quotes and unlock trading."}
            </DialogDescription>
            <div className="pricing-context">
              <div>
                <span>Crop</span>
                <strong>{crop.name}</strong>
              </div>
              <div>
                <span>Market base / kg</span>
                <strong>${current.marketPrice.toFixed(6)}</strong>
              </div>
              <div>
                <span>Freshness</span>
                <strong>{game.freshness}%</strong>
              </div>
              <div>
                <span>Day {game.day} demand</span>
                <strong>See each channel below</strong>
              </div>
            </div>
            <p className="pricing-scroll-hint">
              Scroll the table sideways to compare all buyer channels.
            </p>
            <div className="table-scroll">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Multiplier</th>
                    {offers.map((o) => (
                      <th key={o.channel}>
                        {o.channel.charAt(0).toUpperCase() + o.channel.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Daily demand</td>
                    {offers.map((o) => (
                      <td key={o.channel}>
                        <DemandBadge demand={o.demand} />
                      </td>
                    ))}
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>{row.name}</td>
                      {offers.map((o) => (
                        <td key={o.channel}>{o[row.key].toFixed(4)}×</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="pricing-final-row">
                    <td>Final price / kg</td>
                    {offers.map((o) => (
                      <td
                        key={o.channel}
                        className={o.capacity > 0 && o.finalPrice === highest ? "positive" : ""}
                      >
                        {money(o.finalPrice)}
                        {o.capacity === 0 && <span className="pricing-best">CLOSED TODAY</span>}
                        {o.capacity > 0 && o.finalPrice === highest && (
                          <span className="pricing-best">HIGHEST PRICE</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="pricing-formula-note">
              <Info size={13} />
              Calculations use full precision and round the final price to cents. Highest price per
              kg can still mean a lower net return after selling costs.
            </p>
            <div className="pricing-crop-watch">
              <h3>
                Other crop markets <span>SIMULATED · NO INVENTORY</span>
              </h3>
              {Object.values(CROP_PRICING)
                .filter((c) => c.id !== crop.id && snapshots.crops[c.id])
                .map((c) => {
                  const market = snapshots.crops[c.id];
                  return (
                    <div key={c.id}>
                      <strong>{c.name}</strong>
                      <span>{money(market.marketPrice)} / kg</span>
                      <MarketMovement change={market.changePercent} />
                      <span>
                        {market.channelDemand
                          ? `W: ${market.channelDemand.wholesaler} · R: ${market.channelDemand.retailer} · Dining: ${market.channelDemand.restaurant}`
                          : `${market.demand} demand`}
                      </span>
                    </div>
                  );
                })}
              <p>
                Each crop gets independent demand rolls for each channel and its own market shock
                roll. Select a crop from your inventory to trade it.
              </p>
            </div>
            <DialogClose asChild>
              <Button variant="outline" className="mt-5 w-full">
                Back to trading
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
