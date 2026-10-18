"use client";

import { Sparkles, Sprout, LockKeyhole } from "lucide-react";

import { getScenario } from "@/engine/scenario";

import { useGameStore } from "@/store/gameStore";

import type { GameState } from "@/types/game";

export function Scenario({ game }: { game: GameState }) {
  const pick = useGameStore((s) => s.pickScenario);

  const hand = game.dailyScenarios?.[game.day];

  const selected = getScenario(game);

  if (!hand) return null;

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
        {hand.cards.map((id, index) => {
          const revealed = selected?.id === id;

          return (
            <button
              key={index}
              type="button"
              className={`scenario-card ${revealed ? "revealed" : "face-down"}`}

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
                  <span>ACTIVE TODAY</span>
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
