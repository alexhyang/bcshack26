"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BuyerId, GameResult, GameState } from "@/types/game";
import { createInitialState, advanceDay } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";
import { restoreGame } from "@/engine/saves";
import { addInventoryCrop, removeInventoryCrop, selectInventoryCrop } from "@/engine/portfolio";
import { createMarketSeed } from "@/features/pricing/random";
const freshSeason = (): GameState => ({
  ...createInitialState(marketProvider, { seed: createMarketSeed() }),
  cropInventory: [],
  inventory: 0,
});

import { prepareScenario, chooseScenario } from "@/engine/scenario";
interface GameStore {
  addInventory: (cropId: string, quantity: number) => GameResult;
  removeInventory: (cropId: string) => void;
  selectCrop: (cropId: string) => void;
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
      addInventory: (cropId, quantity) => {
        const result = addInventoryCrop(get().game, cropId, quantity);
        if (result.ok) set({ game: result.state });
        return result;
      },
      removeInventory: (cropId) => set({ game: removeInventoryCrop(get().game, cropId) }),
      selectCrop: (cropId) => set({ game: selectInventoryCrop(get().game, cropId) }),
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
      reset: () => {
        const current = get().game;
        const initial = freshSeason();
        if (current.cropInventory) {
          const items = current.cropInventory.map((item) => ({
            ...item,
            inventory: item.initialInventory,
            spoiled: 0,
          }));
          set({
            game: {
              ...initial,
              cropInventory: items,
              activeCropId: current.activeCropId,
              inventory: items.find((item) => item.cropId === current.activeCropId)?.inventory ?? 0,
            },
          });
        } else set({ game: initial });
      },
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
