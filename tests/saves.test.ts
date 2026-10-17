import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreGame } from "@/engine/saves";
import { createInitialState, advanceDay } from "@/engine/game";
import { executeSale } from "@/engine/trading";
import { marketProvider } from "@/data/simulated-provider";

describe("saved seasons", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("restores a played season by replaying its orders and overnight costs", () => {
    const sale = executeSale(createInitialState(), marketProvider.getDay(1), "retailer", 250);
    if (!sale.ok) throw Error("Expected valid sale");
    const advanced = advanceDay(sale.state);
    if (!advanced.ok) throw Error("Expected advance");
    expect(restoreGame(JSON.parse(JSON.stringify(advanced.state)))).toEqual(advanced.state);
    expect(restoreGame({ ...advanced.state, cash: 99999, inventory: 99999 })).toEqual(
      advanced.state,
    );
  });
  it("restores finished seasons including trades in the final session", () => {
    let state = createInitialState();
    for (let day = 1; day <= 7; day++) {
      const result = advanceDay(state);
      if (!result.ok) throw Error("Expected advance");
      state = result.state;
    }
    expect(restoreGame(state)).toEqual(state);
    expect(restoreGame(state).completed).toBe(true);
  });
  it.each([
    null,
    {},
    { scenarioId: "old" },
    { ...createInitialState(), day: 8 },
    { ...createInitialState(), completed: true },
    { ...createInitialState(), transactions: [null] },
    { ...createInitialState(), transactions: [{ day: 1, buyerId: "restaurant", quantity: 99999 }] },
  ])("recovers safely from malformed or incompatible data", (saved) => {
    expect(restoreGame(saved)).toEqual(createInitialState());
  });
  it("resets actual Zustand state and persisted progress", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    const { useGameStore } = await import("@/store/gameStore");
    useGameStore.getState().reset();
    useGameStore.getState().sell("restaurant", 100);
    useGameStore.getState().nextDay();
    expect(useGameStore.getState().game.day).toBe(2);
    useGameStore.getState().reset();
    expect(useGameStore.getState().game).toEqual(createInitialState());
    expect(JSON.parse(values.get("farmstreet-save")!).state.game).toEqual(createInitialState());
  });
});
