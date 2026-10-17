import { ArrowUpRight, ArrowRightLeft, ReceiptText } from "lucide-react";
import type { GameState } from "@/types/game";
import { kg, money } from "@/lib/utils";
import { CHANNEL_COLORS } from "@/components/market/MarketWatch";
export function TradeHistory({
  game,
  compact = false,
  onViewAll,
}: {
  game: GameState;
  compact?: boolean;
  onViewAll?: () => void;
}) {
  const trades = [...game.transactions].reverse();
  const rows = compact ? trades.slice(0, 4) : trades;
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div className="flex items-center gap-2">
          <ArrowRightLeft size={15} className="text-slate-500" />
          <h2>{compact ? "Recent transactions" : "All transactions"}</h2>
          <span className="tiny-badge">{game.transactions.length}</span>
        </div>
        {compact && onViewAll && (
          <button className="text-link" onClick={onViewAll}>
            View all <ArrowUpRight size={13} />
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div className="empty-trades">
          <div className="empty-icon">
            <ReceiptText size={21} />
          </div>
          <div>
            <strong>Your harvest’s next move starts here.</strong>
            <p>Choose a buyer and place your first sell order.</p>
          </div>
          <span className="empty-dash">—</span>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Buyer</th>
                <th>Quantity</th>
                <th>Price / kg</th>
                <th>Costs</th>
                <th>Net return</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((trade) => (
                <tr key={trade.id}>
                  <td>
                    <span className="day-chip">Day {trade.day}</span>
                  </td>
                  <td>
                    <span className="table-buyer">
                      <span
                        className="channel-dot"
                        style={{ background: CHANNEL_COLORS[trade.buyerId] }}
                      />
                      {trade.buyerName}
                    </span>
                  </td>
                  <td>
                    {kg(trade.quantity)} <span className="text-slate-600">kg</span>
                  </td>
                  <td>{money(trade.price)}</td>
                  <td className="text-slate-400">{money(trade.sellingCosts)}</td>
                  <td className={trade.netReturn >= 0 ? "positive" : "negative"}>
                    {trade.netReturn >= 0 ? "+" : ""}
                    {money(trade.netReturn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
