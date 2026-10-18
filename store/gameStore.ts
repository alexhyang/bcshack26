"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BuyerId, GameResult, GameState } from "@/types/game";
import { createInitialState, advanceDay } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
import { restoreGame } from "@/engine/saves";
import { validHarvest } from "@/data/crops";
import { createMarketSeed } from "@/features/pricing/random";
const freshSeason = (harvest?: GameState["harvest"]) =>
  createInitialState(marketProvider, { seed: createMarketSeed(), harvest });

import { prepareScenario, chooseScenario } from "@/engine/scenario";
interface GameStore {
  configureHarvest: (cropId: string, quantity: number) => GameResult;
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
      configureHarvest: (cropId, quantity) => {
        const current = get().game;
        if (current.day !== 1 || current.completed || current.transactions.length > 0)
          return { ok: false, error: "Start a new season to change your harvest after trading." };
        const harvest = { cropId, initialInventory: quantity };
        if (!validHarvest(harvest))
          return {
            ok: false,
            error: "Choose a crop and enter 0.01–100,000,000 kg, using at most two decimal places.",
          };
        const game = {
          ...createInitialState(marketProvider, { seed: current.pricing?.seed, harvest }),
          dailyScenarios: current.dailyScenarios,
        };
        set({ game });
        return { ok: true, state: game };
      },
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
      reset: () => set({ game: freshSeason(get().game.harvest) }),
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
