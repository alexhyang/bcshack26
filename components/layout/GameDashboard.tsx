"use client";
import { Scenario } from "@/components/events/Scenario";
import { getScenario, scenarioPending } from "@/engine/scenario";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  Info,
  Sprout,
  X,
  CheckCircle2,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import type { BuyerId, GameView } from "@/types/game";
import { Header } from "./Header";
import { Tutorial } from "@/components/tutorial/Tutorial";
import { Sidebar } from "./Sidebar";
import { InventoryPanel } from "@/components/farm/InventoryPanel";
import { PriceChart } from "@/components/market/PriceChart";
import { BuyerOffers } from "@/components/market/BuyerOffers";
import { SellPanel } from "@/components/trading/SellPanel";
import { TradeHistory } from "@/components/trading/TradeHistory";
import { NewsFeed } from "@/components/events/NewsFeed";
import { Results } from "@/components/results/Results";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { getMarketForGame } from "@/features/pricing/market";
import { kg, money } from "@/lib/utils";
export function GameDashboard() {
  const { game, nextDay, reset, dealScenario } = useGameStore();

  const [ready, setReady] = useState(false);
  // Deliberately not persisted: show the guide on every launch, including saved seasons.
  const [tutorialOpen, setTutorialOpen] = useState(true);
  const [view, setView] = useState<GameView>("dashboard");
  const [selected, setSelected] = useState<BuyerId>("wholesaler");
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [dismissedDay, setDismissedDay] = useState(0);
  const [saveWarning, setSaveWarning] = useState(false);
  useEffect(() => {
    Promise.resolve(useGameStore.persist.rehydrate())
      .catch(() => setSaveWarning(true))
      .finally(() => setReady(true));
    try {
      const key = "farmstreet-storage-check";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
    } catch {
      setSaveWarning(true);
    }
  }, []);
  useEffect(() => {
    if (ready) dealScenario();
  }, [ready, game.day, game.completed, game.dailyScenarios, dealScenario]);
  function restart() {
    reset();
    setView("dashboard");
    setSelected("wholesaler");
    setDismissedDay(0);
  }
  function advance() {
    const result = nextDay();
    setAdvanceOpen(false);
    if (result.ok && result.state.completed) setView("results");
  }
  const market = getMarketForGame(game);
  const lastSummary = game.summaries.at(-1);
  const todayTrades = game.transactions.filter((t) => t.day === game.day);
  const todayNet = todayTrades.reduce((sum, t) => sum + t.netReturn, 0);
  const actualView = game.completed && view === "dashboard" && !tutorialOpen ? "results" : view;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [actualView, game.day]);
  if (!ready)
    return (
      <div className="loading-screen">
        <span className="brand-icon">
          <Sprout size={28} />
        </span>
        <strong>
          FarmStreet<span className="text-emerald-400">.</span>
        </strong>
        <p>Getting your trading desk ready…</p>
      </div>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to trading dashboard
      </a>
      <Header
        day={game.day}
        completed={game.completed}
        onReset={restart}
        onTutorial={() => setTutorialOpen(true)}
      />
      {tutorialOpen && (
        <Tutorial
          onNavigate={setView}
          onClose={() => {
            setTutorialOpen(false);
            setView(game.completed ? "results" : "dashboard");
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        />
      )}
      <div className="app-shell">
        <Sidebar game={game} view={actualView} setView={setView} />
        <main id="main" className="main-workspace">
          <div className="page-heading">
            <div>
              <div className="page-eyebrow">
                <span className="status-dot" />
                THE AGRICULTURAL MARKET SIMULATOR
              </div>
              <h1>
                {actualView === "history"
                  ? "Trade history"
                  : actualView === "results"
                    ? "Season results"
                    : "Market overview"}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {actualView === "history"
                  ? "Every order, every cost. Your season on the record."
                  : actualView === "results"
                    ? "See what your decisions brought to the table."
                    : "Your harvest. Your strategy. Make every kilogram count."}
              </p>
            </div>
            <div className="day-indicator">
              <span>TRADING SESSION</span>
              <strong>
                Day {String(game.day).padStart(2, "0")}
                <small> / 07</small>
              </strong>
              <div className="day-progress">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={i + 1 <= game.day ? "done" : ""} />
                ))}
              </div>
            </div>
          </div>
          {saveWarning && (
            <div className="save-warning" role="status">
              <Info size={15} />
              Browser storage is unavailable. You can play, but progress may be lost when you
              reload.
            </div>
          )}
          <InventoryPanel game={game} />
          {actualView === "results" ? (
            <Results game={game} onReset={restart} onContinue={() => setView("dashboard")} />
          ) : actualView === "history" ? (
            <>
              <TradeHistory game={game} />
              <section className="panel day-recaps">
                <div className="panel-heading">
                  <h2>Session recaps</h2>
                  <Clock3 size={15} />
                </div>
                {game.summaries.length === 0 ? (
                  <p className="recap-empty">
                    Advance to your next session to see your first day recap.
                  </p>
                ) : (
                  game.summaries.map((s) => (
                    <article key={s.day}>
                      <span className="day-chip">Day {s.day}</span>
                      <div>
                        <p>
                          {getScenario(game, s.day) && (
                            <>
                              <strong>{getScenario(game, s.day)!.title}</strong>
                              {" · "}
                            </>
                          )}
                          {s.feedback}
                        </p>

                        <small>
                          {kg(s.sold)} kg sold · {money(s.netReturn)} selling return ·{" "}
                          {money(s.storageCosts)} storage
                        </small>
                      </div>
                    </article>
                  ))
                )}
              </section>
            </>
          ) : (
            <>
              <Scenario game={game} />
              {lastSummary && dismissedDay !== game.day && (
                <div className="daily-feedback" role="status">
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Day {lastSummary.day} in review</strong>
                    <p>{lastSummary.feedback}</p>
                  </div>
                  <button onClick={() => setDismissedDay(game.day)} aria-label="Dismiss day review">
                    <X size={15} />
                  </button>
                </div>
              )}
              <div className="dashboard-columns">
                <div className="market-column">
                  <div className="market-top-row">
                    <PriceChart game={game} />
                    <SellPanel
                      key={`${game.day}-${selected}`}
                      game={game}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  </div>
                  <BuyerOffers game={game} selected={selected} onSelect={setSelected} />
                  <TradeHistory game={game} compact onViewAll={() => setView("history")} />
                </div>
                <NewsFeed game={game} />
              </div>
              <section className="next-day-bar">
                <div className="next-day-summary">
                  <span className="day-summary-icon">
                    <CircleCheck size={19} />
                  </span>
                  <div>
                    <strong>Today’s session</strong>
                    <p>
                      {todayTrades.length} order{todayTrades.length !== 1 ? "s" : ""}
                      <span>·</span>
                      <span className={todayNet >= 0 ? "positive" : "negative"}>
                        {money(todayNet)} net selling return
                      </span>
                    </p>
                  </div>
                </div>
                <div className="next-day-action">
                  <span>
                    <Clock3 size={12} />
                    {game.day === 7 ? "Last call for your harvest" : "Tomorrow is a new market"}
                  </span>
                  <Button
                    size="lg"
                    data-tour="next-day"
                    disabled={scenarioPending(game)}
                    onClick={() => setAdvanceOpen(true)}
                  >
                    {game.day === 7 ? "End season" : "Next Market Day"}
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </section>
            </>
          )}
          <footer className="workspace-footer">
            <span>
              <Sprout size={12} />
              FARMSTREET <span className="text-slate-700">/</span> GROW YOUR MARKET INSTINCT
            </span>
            <span>
              Simulated data. Real lessons.
              <span className="footer-cad">
                All amounts in CAD <ArrowUpRight size={11} />
              </span>
            </span>
          </footer>
        </main>
      </div>
      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent>
          <DialogTitle className="text-xl font-semibold">
            {game.day === 7
              ? "Ready to close your season?"
              : `Close Day ${game.day} and move forward?`}
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-slate-400">
            {game.day === 7
              ? "Your final results will include every sale, selling expense, storage cost, and unsold crop."
              : "Today’s offers will close. Remaining stock goes into storage before the next market session."}
          </DialogDescription>
          <div className="advance-preview">
            <div>
              <span>Inventory remaining</span>
              <strong>{kg(game.inventory)} kg</strong>
            </div>
            {game.day < 7 ? (
              <>
                <div>
                  <span>Overnight storage</span>
                  <strong className="warning">
                    −{money(game.inventory * market.storageCostPerKg)}
                  </strong>
                </div>
                <div>
                  <span>Expected spoilage</span>
                  <strong className="warning">
                    {kg(Math.round(game.inventory * market.spoilageRate * 100) / 100)} kg (
                    {market.spoilageRate * 100}%)
                  </strong>
                </div>
                <div>
                  <span>Freshness next day</span>
                  <strong>{Math.max(0, game.freshness - market.freshnessLoss)}%</strong>
                </div>
              </>
            ) : (
              <div>
                <span>Unsold salvage value</span>
                <strong>$0.00</strong>
              </div>
            )}
          </div>
          {game.inventory > 0 && (
            <div className="info-note">
              <Info size={14} />
              {game.day === 7
                ? "Your remaining inventory will count as unsold. You can still return to the market and trade."
                : "Holding may open new opportunities, but future prices are unknown. Storage costs can make your cash balance negative."}
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">Keep trading</Button>
            </DialogClose>
            <Button onClick={advance}>
              {game.day === 7 ? "See my results" : `Start Day ${game.day + 1}`}
              <ArrowRight size={15} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
