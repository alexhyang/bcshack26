"use client";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  History,
  Trophy,
  Sprout,
  ChevronRight,
  MapPin,
  Leaf,
} from "lucide-react";
import type { GameState, GameView } from "@/types/game";
import { kg } from "@/lib/utils";
export function Sidebar({
  game,
  view,
  setView,
}: {
  game: GameState;
  view: GameView;
  setView: (view: GameView) => void;
}) {
  const nav = [
    { id: "dashboard", label: "Overview", icon: ChartNoAxesCombined },
    { id: "history", label: "Trade history", icon: History },
    { id: "results", label: "Season results", icon: Trophy },
  ] as const;
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="eyebrow">YOUR WORKSPACE</span>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-label={label}
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              className={`nav-link ${view === id ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {id === "dashboard" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
      </div>
      <div className="portfolio-block">
        <div className="sidebar-section-title">
          <span className="eyebrow">FARM PORTFOLIO</span>
          <span className="tiny-badge">01</span>
        </div>
        <div className="crop-preview">
          <div className="carrot-art">
            <CarrotArt />
          </div>
          <div>
            <strong>Carrots</strong>
            <span>
              CRT <span className="text-slate-600">/</span> CAD
            </span>
          </div>
          <ChevronRight size={15} className="ml-auto text-slate-600" />
        </div>
        <div className="inventory-number">
          {kg(game.inventory)}
          <span>kg</span>
        </div>
        <div className="text-xs text-slate-500">of 1,000 kg initial harvest</div>
        <div
          className="inventory-meter"
          role="progressbar"
          aria-label="Inventory remaining"
          aria-valuenow={game.inventory}
          aria-valuemin={0}
          aria-valuemax={1000}
        >
          <div style={{ width: `${game.inventory / 10}%` }} />
        </div>
        <div className="sidebar-pair">
          <span>Freshness</span>
          <span className={game.freshness > 60 ? "positive" : "warning"}>
            <Leaf size={12} />
            {game.freshness}%
          </span>
        </div>
        <div className="sidebar-pair">
          <span>Status</span>
          <span className="text-slate-300">
            <span className={`status-dot ${game.inventory === 0 ? "muted" : ""}`} />
            {game.completed
              ? "Season closed"
              : game.inventory === 0
                ? "Sold out"
                : game.freshness > 60
                  ? "Market ready"
                  : "Sell soon"}
          </span>
        </div>
      </div>
      <div className="sidebar-location">
        <MapPin size={13} /> Fraser Valley, BC<span>Canadian harvest · Season 01</span>
      </div>
      <div className="sidebar-bottom">
        <div className="learn-icon">
          <Sprout size={19} />
        </div>
        <strong>A little market wisdom.</strong>
        <p>The best price isn’t always the best return. Keep an eye on the costs.</p>
        <button onClick={() => setView("results")}>
          See your progress <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="sidebar-footer">
        <span className="status-dot" /> Locally saved · No account needed
      </div>
    </aside>
  );
}
export function CarrotArt() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="m44 31 11-16M46 30l20-5M43 28l-2-16"
        stroke="#61bc71"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M49 29c9 6 10 13 3 21L22 71c-3 2-5 0-4-3l13-34c4-9 11-10 18-5Z" fill="#f8984c" />
      <path
        d="m32 38 10 5m-15 7 8 4m3-24 8 4"
        stroke="#cc6c31"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M37 32c-5 7-12 26-15 33" stroke="#ffbd76" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
