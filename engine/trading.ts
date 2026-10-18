import { scenarioPending } from "./scenario";
import type {
  BuyerId,
  BuyerOffer,
  GameResult,
  GameState,
  MarketDay,
  OrderPreview,
  Transaction,
} from "@/types/game";
import { getBuyer } from "./market";

export const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function previewOrder(offer: BuyerOffer, quantity: number): OrderPreview {
  const grossRevenue = round(quantity * offer.price);
  const variableCost = round(quantity * offer.variableCost);
  const sellingCosts = round(offer.fixedCost + variableCost);
  return {
    quantity,
    grossRevenue,
    fixedCost: offer.fixedCost,
    variableCost,
    sellingCosts,
    netReturn: round(grossRevenue - sellingCosts),
  };
}

export function validateOrder(
  state: GameState,
  day: Readonly<MarketDay>,
  buyerId: BuyerId,
  quantity: number,
): string | null {
  if (scenarioPending(state)) return "Reveal today’s scenario card before trading.";
  if (state.completed) return "This season has ended. Start a new season to trade.";
  if (day.day !== state.day) return "The market has changed. Review today's offer.";
  const offer = getBuyer(day, buyerId);
  if (!offer) return "Choose an available buyer.";
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0)
    return "Enter a quantity greater than 0 kg.";
  if (Math.abs(quantity * 100 - Math.round(quantity * 100)) > 0.000001)
    return "Use at most two decimal places for kilograms.";
  if (state.transactions.some((t) => t.day === state.day && t.buyerId === buyerId))
    return "You have already sold to this buyer today. Each buyer accepts one order per day.";
  if (quantity > state.inventory) return "This order exceeds your available inventory.";
  if (offer.capacity === 0) return "This buyer is closed today.";
  if (quantity > offer.capacity) return "This order exceeds the buyer's remaining capacity.";
  return null;
}

export function executeSale(
  state: GameState,
  day: Readonly<MarketDay>,
  buyerId: BuyerId,
  quantity: number,
): GameResult {
  const error = validateOrder(state, day, buyerId, quantity);
  if (error) return { ok: false, error };
  const offer = getBuyer(day, buyerId)!;
  const preview = previewOrder(offer, quantity);
  const transaction: Transaction = {
    ...preview,
    id: `D${state.day}-${buyerId}-${state.transactions.length + 1}`,
    day: state.day,
    buyerId,
    buyerName: offer.name,
    price: offer.price,
  };
  return {
    ok: true,
    state: {
      ...state,
      inventory: round(state.inventory - quantity),
      cash: round(state.cash + preview.netReturn),
      grossRevenue: round(state.grossRevenue + preview.grossRevenue),
      sellingCosts: round(state.sellingCosts + preview.sellingCosts),
      transactions: [...state.transactions, transaction],
    },
  };
}
