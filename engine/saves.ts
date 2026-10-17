import { marketProvider } from "@/data/simulated-provider";
import { advanceDay, createInitialState } from "./game";
import { executeSale } from "./trading";
import type { BuyerId, GameState } from "@/types/game";

/** Restore by replaying validated orders. Never trust cached balances or inventory. */
export function restoreGame(value: unknown): GameState {
  const initial = createInitialState();
  if (!value || typeof value !== "object") return initial;
  const saved = value as Record<string, unknown>;
  if (
    saved.scenarioId !== marketProvider.scenarioId ||
    !Number.isInteger(saved.day) ||
    (saved.day as number) < 1 ||
    (saved.day as number) > marketProvider.duration ||
    typeof saved.completed !== "boolean" ||
    (saved.completed && saved.day !== marketProvider.duration) ||
    !Array.isArray(saved.transactions) ||
    saved.transactions.length > marketProvider.duration * 3
  )
    return initial;
  const transactions = saved.transactions;
  if (
    transactions.some((trade: unknown) => {
      if (!trade || typeof trade !== "object") return true;
      const t = trade as Record<string, unknown>;
      return (
        !Number.isInteger(t.day) ||
        (t.day as number) < 1 ||
        (t.day as number) > (saved.day as number) ||
        typeof t.buyerId !== "string" ||
        typeof t.quantity !== "number"
      );
    })
  )
    return initial;
  let state = initial;
  for (let day = 1; day <= (saved.day as number); day++) {
    for (const t of transactions.filter((t) => t.day === day)) {
      const result = executeSale(
        state,
        marketProvider.getDay(day),
        t.buyerId as BuyerId,
        t.quantity,
      );
      if (!result.ok) return initial;
      state = result.state;
    }
    if (day < (saved.day as number) || saved.completed) {
      const result = advanceDay(state);
      if (!result.ok) return initial;
      state = result.state;
    }
  }
  return state;
}
