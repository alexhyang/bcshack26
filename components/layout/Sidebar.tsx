"use client";
import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, History, Trophy, Sprout, MapPin } from "lucide-react";
import type { GameState, GameView } from "@/types/game";
import { CropInventory } from "@/components/farm/CropInventory";
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
      <Link href="/" className="sidebar-brand" aria-label="FarmSmart home">
        <span className="brand-icon">
          <Sprout size={29} strokeWidth={2.1} />
        </span>
        <span>
          FarmSmart<span className="brand-period">.</span>
        </span>
      </Link>
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
        <CropInventory game={game} />
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
