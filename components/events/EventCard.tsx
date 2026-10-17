import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Truck,
  CloudSun,
  ChartNoAxesCombined,
  Wheat,
} from "lucide-react";
import type { MarketEvent } from "@/types/game";
export function EventCard({ event, day }: { event: MarketEvent; day: number }) {
  const Icon = { demand: ChartNoAxesCombined, supply: Wheat, transport: Truck, weather: CloudSun }[
    event.category
  ];
  return (
    <article className={`event-card ${event.sentiment}`}>
      <div className="event-meta">
        <span>
          <Icon size={11} />
          {event.category.toUpperCase()}
        </span>
        <span>DAY {day} · NOW</span>
      </div>
      <h3>{event.headline}</h3>
      <div className="event-impact">
        {event.sentiment === "positive" ? (
          <ArrowUpRight size={13} />
        ) : event.sentiment === "negative" ? (
          <ArrowDownRight size={13} />
        ) : (
          <Minus size={13} />
        )}
        {event.impact}
      </div>
      <p>{event.explanation}</p>
    </article>
  );
}
