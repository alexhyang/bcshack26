"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BuyerId, GameResult, GameState } from "@/types/game";
import { createInitialState, advanceDay } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
import { restoreGame } from "@/engine/saves";
import { createMarketSeed } from "@/features/pricing/random";
const freshSeason = () => createInitialState(marketProvider, { seed: createMarketSeed() });

import { prepareScenario, chooseScenario } from "@/engine/scenario";
interface GameStore {
  dealScenario: () => void;
  pickScenario: (index: number) => void;
  game: GameState;
  sell: (buyer: BuyerId, quantity: number) => GameResult;
  nextDay: () => GameResult;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      game: freshSeason(),
      dealScenario: () => set({ game: prepareScenario(get().game) }),
      pickScenario: (index) => {
        const result = chooseScenario(get().game, index);
        if (result.ok) set({ game: result.state });
      },
      sell: (buyer, quantity) => {
        const current = prepareScenario(get().game);

        const result = executeSale(current, marketProvider.getDay(current.day), buyer, quantity);

        if (result.ok) set({ game: result.state });
        return result;
      },
      nextDay: () => {
        const current = prepareScenario(get().game);

        const result = advanceDay(current);

        if (result.ok) set({ game: prepareScenario(result.state) });

        return result;
      },
      reset: () => set({ game: freshSeason() }),
    }),
    {
      name: "farmstreet-save",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ game: state.game }),
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        // Save the opening seed (and any migrated save) before the first trade.
        // Otherwise reloading a brand-new Day 1 could accidentally reroll demand.
        if (state && !error) useGameStore.setState({ game: state.game });
      },
      merge: (persisted, current) => {
        const saved = (persisted as { game?: unknown } | null)?.game;
        return saved ? { ...current, game: restoreGame(saved) } : current;
      },
    },
  ),
);
