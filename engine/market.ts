import type { BuyerId, GameState, MarketDay } from "@/types/game";

export function getBuyer(day: Readonly<MarketDay>, id: BuyerId) {
  return day.offers.find((offer) => offer.id === id);
}

export function remainingCapacity(state: GameState, day: Readonly<MarketDay>, id: BuyerId): number {
  const offer = getBuyer(day, id);
  if (!offer || state.transactions.some((t) => t.day === state.day && t.buyerId === id)) return 0;
  return offer.capacity;
}

export function priceMovement(current: number, previous?: number) {
  return previous ? ((current - previous) / previous) * 100 : 0;
}
