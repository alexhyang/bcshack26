import { getScenario, scenarioMarket } from "@/engine/scenario";
import {
  Radio,
  CloudSun,
  Truck,
  CircleHelp,
  Lightbulb,
  ArrowUpRight,
  Leaf,
  Thermometer,
} from "lucide-react";
import { marketProvider } from "@/data/simulated-provider";
import { EventCard } from "./EventCard";
import type { GameState } from "@/types/game";
import { money, kg } from "@/lib/utils";
const lessons = [
  {
    title: "Price is only half the picture.",
    text: "A small restaurant order can earn less per kg after delivery than a larger retailer order. Compare net returns at your chosen quantity.",
  },
  {
    title: "Demand can open a window.",
    text: "More customers mean buyers may pay more. Capacity still sets a limit on how much you can sell at that price.",
  },
  {
    title: "Abundance changes the balance.",
    text: "When supply grows faster than demand, prices often fall. Holding your harvest also has a cost.",
  },
  {
    title: "The road affects your return.",
    text: "Transport is a real expense. A high selling price is less attractive when delivery takes a costly detour.",
  },
  {
    title: "Your harvest has a shelf life.",
    text: "Waiting means risking spoilage. A future price increase only helps the carrots you still have left to sell.",
  },
  {
    title: "Count the cost of waiting.",
    text: "Today’s high offers look appealing. Remember to subtract the storage costs you paid to get here.",
  },
  {
    title: "A buyer today has value.",
    text: "As the season closes, selling remaining stock can be more valuable than holding out for a perfect price.",
  },
];
export function NewsFeed({ game }: { game: GameState }) {
  const market = scenarioMarket(game, marketProvider.getDay(game.day));

  const scenario = getScenario(game);

  const oldEvents = marketProvider
    .getHistory(game.day)
    .slice(0, -1)
    .flatMap((d) => d.events.map((e) => ({ ...e, day: d.day })))
    .reverse()
    .slice(0, 2);
  const lesson = lessons[game.day - 1];
  return (
    <aside className="intelligence-column">
      <section className="panel intelligence-panel" data-tour="market-intelligence">
        <div className="panel-heading">
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-amber-400" />
            <h2>Market intelligence</h2>
          </div>
          <span className="live-dot" />
        </div>
        <div className="news-section-label">
          TODAY’S MARKET MOVERS<span>{market.events.length + (scenario ? 1 : 0)} ACTIVE</span>
        </div>
        <div className="events-list">
          {scenario && (
            <article className="event-card neutral">
              <div className="event-meta">
                <span>DAILY SCENARIO</span>
                <span>DAY {game.day}</span>
              </div>
              <h3>{scenario.title}</h3>
              <p>{scenario.description}</p>
            </article>
          )}
          {market.events.map((event) => (
            <EventCard
              key={event.id}
              event={scenario ? { ...event, impact: `Base market: ${event.impact}` } : event}
              day={game.day}
            />
          ))}
        </div>
        {oldEvents.length > 0 && (
          <div className="earlier-news">
            <span className="eyebrow">PREVIOUS SESSIONS</span>
            {oldEvents.map((e) => (
              <div key={e.id}>
                <span>DAY {e.day}</span>
                <p>{e.headline}</p>
              </div>
            ))}
          </div>
        )}
        <div className="news-footer">
          <span className="status-dot" />
          Fictional events · Updated each game day
        </div>
      </section>
      <section className="panel conditions-panel">
        <div className="panel-heading">
          <h2>Field conditions</h2>
          <CloudSun size={16} className="text-slate-500" />
        </div>
        <div className="weather-main">
          <CloudSun size={35} strokeWidth={1.2} className="text-amber-200" />
          <div>
            <strong>
              {market.temperature}°<span>C</span>
            </strong>
            <small>{market.weather}</small>
          </div>
          <span className="weather-location">
            FRASER
            <br />
            VALLEY, BC
          </span>
        </div>
        <div className="condition-row">
          <span>
            <Thermometer size={13} />
            Overnight spoilage
          </span>
          <strong className={market.spoilageRate >= 0.05 ? "warning" : ""}>
            {Math.round(market.spoilageRate * 1000) / 10}%
          </strong>
        </div>
        <div className="condition-row">
          <span>
            <Leaf size={13} />
            Storage / kg / night
          </span>
          <strong>${market.storageCostPerKg.toFixed(3)}</strong>
        </div>
        <div className="condition-row">
          <span>
            <Truck size={13} />
            Transport
          </span>
          <strong className={game.day === 4 ? "warning" : "positive"}>
            {game.day === 4 ? "Disrupted" : "Normal"}
          </strong>
        </div>
        <div className="holding-estimate">
          <CircleHelp size={13} />
          <span>
            {game.day === 7 ? (
              "Final session: there are no more overnight storage or spoilage charges. Remaining carrots count as unsold when you end the season."
            ) : (
              <>
                Holding {kg(game.inventory)} kg tonight would cost{" "}
                <b>{money(game.inventory * market.storageCostPerKg)}</b> before spoilage.
              </>
            )}
          </span>
        </div>
      </section>
      <section className="learning-card">
        <div className="learning-heading">
          <span>
            <Lightbulb size={14} />
            THE FARMER’S EDGE
          </span>
          <ArrowUpRight size={14} />
        </div>
        <h3>{lesson.title}</h3>
        <p>{lesson.text}</p>
        <div className="lesson-dots">
          {lessons.map((_, i) => (
            <span key={i} className={i === game.day - 1 ? "active" : ""} />
          ))}
        </div>
      </section>
    </aside>
  );
}
