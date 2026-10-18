import { getGameCrop, validCropQuantity } from "@/data/crops";
import { CROP } from "@/data/scenarios";
import type { GameResult, GameState, Transaction } from "@/types/game";
import { round } from "@/lib/numbers";

export function inventoryItems(state: GameState) {
  return (
    state.cropInventory ?? [
      {
        cropId: CROP.id,
        initialInventory: CROP.initialInventory,
        inventory: state.inventory,
        spoiled: state.spoiled,
      },
    ]
  );
}
export function totalInventory(state: GameState) {
  return round(inventoryItems(state).reduce((sum, item) => sum + item.inventory, 0));
}
export function initialInventory(state: GameState) {
  return round(inventoryItems(state).reduce((sum, item) => sum + item.initialInventory, 0));
}
export function tradeIsForActiveCrop(state: GameState, trade: Transaction) {
  return (trade.cropId ?? CROP.id) === getGameCrop(state).id;
}
export function selectInventoryCrop(state: GameState, cropId: string): GameState {
  const item = inventoryItems(state).find((item) => item.cropId === cropId);
  if (!item) return state;
  if (!state.cropInventory && cropId === CROP.id) return state;
  return { ...state, activeCropId: cropId, inventory: item.inventory };
}
export function addInventoryCrop(state: GameState, cropId: string, quantity: number): GameResult {
  if (state.day !== 1 || state.transactions.length || state.completed)
    return {
      ok: false,
      error: "Build your inventory before your first sale. Start a new season to change it.",
    };
  if (!validCropQuantity(cropId, quantity))
    return {
      ok: false,
      error:
        "Choose a crop and enter a positive kg amount with at most two decimal places (maximum 100,000,000 kg).",
    };
  const items = inventoryItems(state);
  const existing = items.find((item) => item.cropId === cropId);
  if (existing && !validCropQuantity(cropId, existing.initialInventory + quantity))
    return { ok: false, error: "This crop would exceed the maximum inventory size." };
  const updated = existing
    ? items.map((item) =>
        item.cropId === cropId
          ? {
              ...item,
              initialInventory: round(item.initialInventory + quantity),
              inventory: round(item.inventory + quantity),
            }
          : item,
      )
    : [...items, { cropId, initialInventory: quantity, inventory: quantity, spoiled: 0 }];
  return {
    ok: true,
    state: {
      ...state,
      cropInventory: updated,
      activeCropId: cropId,
      inventory: updated.find((item) => item.cropId === cropId)!.inventory,
    },
  };
}
export function removeInventoryCrop(state: GameState, cropId: string): GameState {
  if (state.day !== 1 || state.transactions.length || state.completed) return state;
  const items = inventoryItems(state).filter((item) => item.cropId !== cropId);
  const active = items.find((item) => item.cropId === state.activeCropId) ?? items[0];
  return {
    ...state,
    cropInventory: items,
    activeCropId: active?.cropId,
    inventory: active?.inventory ?? 0,
  };
}
