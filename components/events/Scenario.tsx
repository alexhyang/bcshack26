"use client";

import { Sparkles, Sprout, LockKeyhole } from "lucide-react";

import { getScenario, scenarioSentiment, SCENARIO_CHANNEL_REASONS } from "@/engine/scenario";

import { useGameStore } from "@/store/gameStore";

import type { GameState } from "@/types/game";

export function Scenario({ game }: { game: GameState }) {
  const pick = useGameStore((s) => s.pickScenario);

  const hand = game.dailyScenarios?.[game.day];

  const selected = getScenario(game);

  const sentiment = selected ? scenarioSentiment(selected) : null;
  if (!hand) return null;
  const selectedIndex = selected ? (hand.selectedIndex ?? hand.cards.indexOf(selected.id)) : -1;
  const indices = hand.cards.map((_, index) => index);
  const remaining = indices.filter((index) => index !== selectedIndex);
  const cardOrder = selected ? [remaining[0], selectedIndex, remaining[1]] : indices;

  return (
    <section className="panel scenario-panel" aria-labelledby="scenario-heading">
      <div className="scenario-heading">
        <div>
          <span className="scenario-eyebrow">
            <Sparkles size={14} /> DAILY SCENARIO · DAY {game.day}
          </span>

          <h2 id="scenario-heading">
            {selected ? selected.title : "Three cards. One market twist."}
          </h2>

          <p>
            {selected
              ? selected.description
              : "Pick one face-down card to discover today’s event. Your choice sets buyer prices for this session."}
          </p>
        </div>

        <span className="scenario-tag">{selected ? selected.category : "CHOOSE 1 OF 3"}</span>
      </div>

      <div className="scenario-cards">
        {cardOrder.map((index) => {
          const revealed = !!selected && index === selectedIndex;

          return (
            <button
              key={index}
              type="button"
              className={`scenario-card ${revealed ? `revealed scenario-${sentiment}` : "face-down"}`}

              disabled={!!selected || game.completed}
              onClick={() => pick(index)}

              aria-label={
                revealed ? `Selected: ${selected.title}` : `Reveal scenario card ${index + 1}`
              }

              aria-pressed={revealed}
            >
              {revealed ? (
                <>
                  <Sparkles size={24} />
                  <strong>{selected.title}</strong>
                  <span className={`scenario-sentiment ${sentiment}`}>{sentiment} card</span>
                  <span className="scenario-card-summary">
                    {Object.entries(selected.multipliers).map(([buyer, multiplier]) => (
                      <span className="scenario-channel-summary" key={buyer}>
                        <b>
                          {buyer} ·{" "}
                          {selected.closed === buyer
                            ? "Closed (×0.00)"
                            : `${multiplier > 1 ? "Buff" : multiplier < 1 ? "Nerf" : "Unchanged"} ×${multiplier.toFixed(2)} (${multiplier >= 1 ? "+" : ""}${Math.round((multiplier - 1) * 100)}%)`}
                        </b>
                        <span>
                          {
                            SCENARIO_CHANNEL_REASONS[selected.id]?.[
                              buyer as keyof typeof selected.multipliers
                            ]
                          }
                        </span>
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <>
                  <Sprout size={30} />
                  <strong>FARMSTREET</strong>
                  <span>{selected ? <LockKeyhole size={14} /> : `REVEAL CARD 0${index + 1}`}</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="scenario-effects" role="status" aria-live="polite">
          {Object.entries(selected.multipliers).map(([buyer, multiplier]) => (
            <div key={buyer}>
              <span>{buyer}</span>
              <strong className={multiplier >= 1 ? "positive" : "negative"}>
                {selected.closed === buyer
                  ? "Closed today"
                  : `×${multiplier.toFixed(2)} (${multiplier >= 1 ? "+" : ""}${Math.round((multiplier - 1) * 100)}%)`}
              </strong>
            </div>
          ))}

          <small>Applied to today’s base offers. Effects expire at the end of the day.</small>
        </div>
      )}
    </section>
  );
}
