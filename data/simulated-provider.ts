import type { MarketDataProvider } from "./market-provider";
import { CROP, GAME_DURATION, SCENARIO, SCENARIO_ID } from "./scenarios";

export class SimulatedMarketProvider implements MarketDataProvider {
  readonly scenarioId = SCENARIO_ID;
  readonly duration = GAME_DURATION;
  readonly crop = CROP;
  getDay(day: number) {
    if (!Number.isInteger(day) || day < 1 || day > this.duration)
      throw new Error("Market day must be between 1 and 7.");
    return SCENARIO[day - 1];
  }
  getHistory(currentDay: number) {
    this.getDay(currentDay);
    return SCENARIO.slice(0, currentDay);
  }
}
export const marketProvider = new SimulatedMarketProvider();
