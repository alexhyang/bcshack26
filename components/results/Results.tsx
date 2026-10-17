"use client";
import {
  ArrowRight,
  Trophy,
  RotateCcw,
  Sprout,
  CheckCircle2,
  ArrowUpRight,
  Scale,
  Package,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { scoreGame } from "@/engine/scoring";
import type { GameState } from "@/types/game";
import { kg, money } from "@/lib/utils";
export function Results({
  game,
  onReset,
  onContinue,
}: {
  game: GameState;
  onReset: () => void;
  onContinue: () => void;
}) {
  const score = scoreGame(game);
  if (!game.completed)
    return (
      <section className="panel progress-panel">
        <div className="results-icon">
          <Sprout size={32} />
        </div>
        <span className="eyebrow">YOUR SEASON IS STILL GROWING</span>
        <h2>There’s more market to explore.</h2>
        <p>
          You’re on Day {game.day} of 7. Keep trading, compare your options, and finish the final
          session to see your complete results.
        </p>
        <div className="progress-preview">
          <div>
            <span>Current selling margin</span>
            <strong className={score.netMargin >= 0 ? "positive" : "negative"}>
              {money(score.netMargin)}
            </strong>
          </div>
          <div>
            <span>Harvest sold</span>
            <strong>{score.soldPercent}%</strong>
          </div>
          <div>
            <span>Remaining inventory</span>
            <strong>{kg(game.inventory)} kg</strong>
          </div>
        </div>
        <Button onClick={onContinue}>
          Back to the market <ArrowRight size={16} />
        </Button>
      </section>
    );
  const comparisonMax = Math.max(Math.abs(score.netMargin), score.baseline, 1);
  return (
    <div className="results-view">
      <section className="panel results-hero">
        <div className="results-icon">
          <Trophy size={29} />
        </div>
        <span className="eyebrow">SEASON 01 · FINAL RESULTS</span>
        <h2>Your harvest. Your results.</h2>
        <p>Seven days of decisions, one complete picture.</p>
        <div className={`results-total ${score.netMargin >= 0 ? "positive" : "negative"}`}>
          {money(score.netMargin)}
          <span>CAD</span>
        </div>
        <span className="text-sm text-slate-400">Estimated net selling margin</span>
        <div className="results-accounting">
          <div>
            <span>Gross sales revenue</span>
            <strong>{money(score.grossRevenue)}</strong>
          </div>
          <span className="accounting-symbol">−</span>
          <div>
            <span>Transport & selling costs</span>
            <strong>{money(score.sellingCosts)}</strong>
          </div>
          <span className="accounting-symbol">−</span>
          <div>
            <span>Storage expenses</span>
            <strong>{money(score.storageCosts)}</strong>
          </div>
        </div>
        <div className="results-disclaimer">
          <Scale size={13} />
          Production costs are excluded. This is a selling margin, not full farm profit.
        </div>
      </section>
      <div className="results-grid">
        <section className="panel results-breakdown">
          <div className="panel-heading">
            <h2>Every carrot accounted for</h2>
            <Package size={16} className="text-slate-500" />
          </div>
          <div className="harvest-bar">
            <span style={{ width: `${score.sold / 10}%` }} />
            <span style={{ width: `${score.spoiled / 10}%` }} />
            <span style={{ width: `${score.unsold / 10}%` }} />
          </div>
          <div className="harvest-legend">
            <span>
              <i className="bg-emerald-400" />
              Sold<strong>{kg(score.sold)} kg</strong>
            </span>
            <span>
              <i className="bg-amber-400" />
              Spoiled<strong>{kg(score.spoiled)} kg</strong>
            </span>
            <span>
              <i className="bg-slate-500" />
              Unsold<strong>{kg(score.unsold)} kg</strong>
            </span>
          </div>
          <div className="result-pair">
            <span>Initial harvest sold</span>
            <strong className="positive">{score.soldPercent}%</strong>
          </div>
          <div className="result-pair">
            <span>Total wasted or unsold</span>
            <strong>{kg(score.wastedOrUnsold)} kg</strong>
          </div>
        </section>
        <section className="panel baseline-panel">
          <div className="panel-heading">
            <h2>How did your strategy compare?</h2>
            <ArrowUpRight size={16} className="text-slate-500" />
          </div>
          <div className="baseline-row">
            <div>
              <span>Your strategy</span>
              <strong className={score.netMargin >= 0 ? "positive" : "negative"}>
                {money(score.netMargin)}
              </strong>
            </div>
            <div className="comparison-bar">
              <span
                style={{
                  width: `${(Math.abs(score.netMargin) / comparisonMax) * 100}%`,
                  background: score.netMargin < 0 ? "var(--red)" : undefined,
                }}
              />
            </div>
          </div>
          <div className="baseline-row">
            <div>
              <span>Sell everything on Day 1</span>
              <strong>{money(score.baseline)}</strong>
            </div>
            <div className="comparison-bar baseline">
              <span style={{ width: `${(score.baseline / comparisonMax) * 100}%` }} />
            </div>
          </div>
          <p className={score.baselineDifference >= 0 ? "positive" : "negative"}>
            {score.baselineDifference >= 0 ? "+" : ""}
            {money(score.baselineDifference)} vs. baseline
          </p>
          <small>
            Baseline: sell 1,000 kg to the Day 1 wholesaler, after its delivery and handling costs.
          </small>
        </section>
      </div>
      <section className="panel takeaways-panel">
        <div className="panel-heading">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-emerald-400" />
            <h2>What your season taught you</h2>
          </div>
        </div>
        <div className="takeaways">
          {score.takeaways.map((lesson, i) => (
            <div key={lesson}>
              <span>0{i + 1}</span>
              <p>{lesson}</p>
              <CheckCircle2 size={16} />
            </div>
          ))}
        </div>
      </section>
      <div className="results-actions">
        <span>Same harvest. A new strategy.</span>
        <Button onClick={onReset}>
          <RotateCcw size={15} />
          Play again
        </Button>
      </div>
    </div>
  );
}
