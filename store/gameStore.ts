"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BuyerId, GameResult, GameState } from "@/types/game";
import { createInitialState, advanceDay } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
import { restoreGame } from "@/engine/saves";

import { prepareScenario, chooseScenario, scenarioMarket } from "@/engine/scenario";
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
      game: createInitialState(),
      dealScenario: () => set({ game: prepareScenario(get().game) }),
      pickScenario: (index) => {
        const result = chooseScenario(get().game, index);
        if (result.ok) set({ game: result.state });
      },
      sell: (buyer, quantity) => {
        const current = prepareScenario(get().game);

        const result = executeSale(
          current,
          scenarioMarket(current, marketProvider.getDay(current.day)),
          buyer,
          quantity,
        );

        if (result.ok) set({ game: result.state });
        return result;
      },
      nextDay: () => {
        const current = prepareScenario(get().game);

        const result = advanceDay(current);

        if (result.ok) set({ game: prepareScenario(result.state) });

        return result;
      },
      reset: () => set({ game: createInitialState() }),
    }),
    {
      name: "farmstreet-save",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ game: state.game }),
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted as { game?: unknown } | null)?.game;
        return { ...current, game: restoreGame(saved) };
      },
    },
  ),
);
