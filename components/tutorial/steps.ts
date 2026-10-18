import type { GameView } from "@/types/game";

interface TutorialStep {
  id: string;
  target: string;
  view: GameView;
  label: string;
  title: string;
  description: string;
  hint: string;
}

export const tutorialSteps: readonly TutorialStep[] = [
  {
    id: "harvest",
    target: "account-summary",
    view: "dashboard",
    label: "Your harvest",
    title: "This is your farm at a glance.",
    description:
      "These cards track cash, net selling margin, remaining crops, and freshness. Build your starting crop inventory in the left sidebar, then select a crop to trade during the seven-day season.",
    hint: "This is your actual saved game. The tour only shows you around; it never sells stock or advances a day.",
  },
  {
    id: "chart",
    target: "price-chart",
    view: "dashboard",
    label: "Read the market",
    title: "Follow the market before you sell.",
    description:
      "Each coloured line represents a buyer channel. Use 1D, 3D, or ALL to change the range; click a channel name to hide or show its line.",
    hint: "Future sessions stay hidden. Sales use the current daily buyer offer, not the illustrative chart ticks.",
  },
  {
    id: "buyers",
    target: "buyer-offers",
    view: "dashboard",
    label: "Compare buyers",
    title: "A high price is only part of the deal.",
    description:
      "First reveal one of today’s three scenario cards above the chart to unlock trading. Then compare price, capacity, and selling costs. Show Price Breakdown explains freshness, demand, channel, and the selected scenario’s effect.",
    hint: "Click a buyer card after the tour to select them. Each buyer accepts one order per day, even if you use only part of their capacity.",
  },
  {
    id: "quantity",
    target: "order-inputs",
    view: "dashboard",
    label: "Build your order",
    title: "Choose who to sell to and how much.",
    description:
      "Pick a selling channel and enter your quantity in kilograms. MAX fills the smaller of your remaining inventory and that buyer’s capacity. Percentage buttons use the same limit.",
    hint: "Selecting a buyer or typing a quantity does not place a sale. The game checks inventory, capacity, and duplicate orders before selling.",
  },
  {
    id: "return",
    target: "order-preview",
    view: "dashboard",
    label: "Check your return",
    title: "Check what you actually keep.",
    description:
      "Gross revenue minus delivery, handling, and packaging gives your estimated net return. Once it looks right, Confirm sale executes the order and updates your cash and inventory.",
    hint: "Fixed delivery fees can make small orders lose money. Production costs are excluded, so selling margin is not full farm profit.",
  },
  {
    id: "news",
    target: "market-intelligence",
    view: "dashboard",
    label: "Watch the news",
    title: "Conditions can change your decision.",
    description:
      "These alerts explain today’s demand, supply, or transport changes. Field conditions below also shows the weather, storage rate, and overnight spoilage risk.",
    hint: "Read the active effects before deciding to hold. All prices, news, and conditions in this game are simulated.",
  },
  {
    id: "advance",
    target: "next-day",
    view: "dashboard",
    label: "Sell or hold",
    title: "Done for today? Move to the next session.",
    description:
      "Use Next Market Day after making your sales. The confirmation shows storage expenses and expected spoilage before you commit. Holding stock costs money and leaves fewer crops to sell.",
    hint: "You can still trade on Day 7. That day this button becomes End season. Unsold crops have $0 salvage value.",
  },
  {
    id: "history",
    target: "trade-history",
    view: "history",
    label: "Review your trades",
    title: "Every completed order appears here.",
    description:
      "Trade history records the buyer, quantity, executed price, selling costs, and net return. The session recaps below explain what happened to stock you held overnight.",
    hint: "Open this page anytime using the history icon in the left sidebar. The tour has opened the real page for you.",
  },
  {
    id: "results",
    target: "season-results",
    view: "results",
    label: "Your results",
    title: "See what your decisions earned.",
    description:
      "Season results shows your progress now and the full breakdown after Day 7: revenue, expenses, sold and wasted stock, and a comparison with selling the full harvest to the Day 1 wholesaler under the same opening conditions.",
    hint: "Finish the tour to return to the game. Use the book button in the header to replay it, or Skip tutorial at any point.",
  },
];
