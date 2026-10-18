import type { Crop, MarketDay } from "@/types/game";

/** A future RealMarketProvider can implement this contract without changing the engine. */
export interface MarketDataProvider {
  readonly mode?: "simulation" | "live";
  readonly scenarioId: string;
  readonly duration: number;
  readonly crop: Readonly<Crop>;
  getDay(day: number): Readonly<MarketDay>;
  /** Only observations available at the current simulated day. */
  getHistory(currentDay: number): readonly Readonly<MarketDay>[];
}
