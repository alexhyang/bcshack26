import { Banknote, ChartNoAxesCombined, Package, Leaf, ArrowUpRight } from "lucide-react";
import type { GameState } from "@/types/game";
import { kg, money } from "@/lib/utils";
export function InventoryPanel({ game }: { game: GameState }) {
  const sold = game.transactions.reduce((sum, t) => sum + t.quantity, 0);
  return (
    <section className="stats-grid" data-tour="account-summary" aria-label="Farm account summary">
      <div className="stat-card">
        <div className="stat-label">
          Available cash
          <Banknote size={16} />
        </div>
        <div className={`stat-value ${game.cash < 0 ? "negative" : ""}`}>
          {money(game.cash)}
          <span>CAD</span>
        </div>
        <div className="stat-foot">
          <span className="status-dot" />
          {game.transactions.length
            ? `${game.transactions.length} completed order${game.transactions.length === 1 ? "" : "s"}`
            : "Ready for your first trade"}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          Net selling margin
          <ChartNoAxesCombined size={16} />
        </div>
        <div className={`stat-value ${game.cash >= 0 ? "positive" : "negative"}`}>
          {money(game.cash)}
        </div>
        <div className="stat-foot">
          <ArrowUpRight size={12} />
          After selling & storage costs
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          Inventory remaining
          <Package size={16} />
        </div>
        <div className="stat-value">
          {kg(game.inventory)}
          <span>kg</span>
        </div>
        <div className="stat-foot">
          {kg(sold)} kg sold<span className="stat-dot">·</span>
          {kg(game.spoiled)} kg spoiled
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">
          Crop freshness
          <Leaf size={16} />
        </div>
        <div className={`stat-value ${game.freshness > 60 ? "" : "warning"}`}>
          {game.freshness}
          <span>%</span>
          <span className={`freshness-tag ${game.freshness <= 60 ? "warning" : ""}`}>
            {game.freshness > 85 ? "Excellent" : game.freshness > 60 ? "Good" : "At risk"}
          </span>
        </div>
        <div className="freshness-meter">
          <div
            style={{
              width: `${game.freshness}%`,
              background: game.freshness > 60 ? undefined : "var(--amber)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
