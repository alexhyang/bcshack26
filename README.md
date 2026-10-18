# FarmSmart

**Your harvest. Your strategy. Make every kilogram count.**

## Project overview

FarmSmart is a browser-based agricultural market simulator that turns selling a harvest into a seven-day strategy game. Build an inventory of crops, compare buyers, respond to daily events, and decide whether to sell now or hold for another market session.

The central challenge is simple: **the highest price is not always the best return.** Delivery fees, buyer capacity, changing demand, freshness, storage costs, and spoilage all affect what you keep from a sale.

FarmSmart is designed for learning and experimentation. Prices, events, and market conditions are fictional, and all amounts are shown in Canadian dollars. Results measure net selling margin; production costs are excluded.

## Key features

- **Build a multi-crop inventory.** Choose from 42 crops across vegetables, fruit and berries, grains and oilseeds, and pulses. Set your starting quantities and switch between crops without losing progress.
- **Compare three buyer channels.** Sell to wholesalers, retailers, or restaurants, each with different prices, capacities, delivery fees, and handling costs.
- **Compare net returns at the same quantity.** Buyer cards use the quantity in your order to show revenue, selling costs, total net return, and net per kilogram. Recommendations explain the difference between eligible buyers, including ties and loss-making orders.
- **Navigate a changing market.** Seeded daily price movements and independent buyer-channel demand combine with crop sensitivity and freshness to determine offers. Open **Show Price Breakdown** to inspect the calculation.
- **Reveal daily scenario cards.** Choose one of three face-down cards to discover a peaceful day or a market event, such as frost, a food festival, or a wholesale strike. Events can change prices or close a buyer for that day. The chosen card moves to the center while the other cards briefly disappear.
- **Balance selling against holding.** Keeping stock overnight incurs storage costs and spoilage, while declining freshness changes buyer offers.
- **Review your strategy.** Explore price charts, trade history, and daily recaps, then compare your final selling margin with an immediate-sale benchmark. Chart ranges and channel toggles reveal only reached sessions; intraday traces are illustrative.
- **Learn through a guided tour.** A spotlight tutorial highlights the actual controls on every launch. Skip it at any time, press Escape, or replay it from the header.
- **Resume in the same browser.** Progress saves automatically in localStorage. The responsive interface supports desktop, tablet, and phone layouts.

## Tech stack

| Area                  | Technologies                                                          |
| --------------------- | --------------------------------------------------------------------- |
| Application           | Next.js 15 App Router, React 19, TypeScript                           |
| Styling               | Tailwind CSS 4, custom CSS, locally bundled DM Sans and IBM Plex Mono |
| UI components         | Radix UI primitives, shadcn/ui-style components, Lucide icons         |
| Charts                | Recharts                                                              |
| State and persistence | Zustand with browser localStorage                                     |
| Simulation            | Pure TypeScript game engine and seeded random market generation       |
| Development tools     | Vitest, ESLint, Prettier                                              |

The application runs without a database, authentication service, or external market-data API.

## Run locally

### Prerequisites

- Node.js 22 or newer
- npm
- Git, if cloning the repository

### Start the development server

The playable project is currently on the `wip` branch:

```bash
git clone --branch wip https://github.com/alexhyang/bcshack26.git
cd bcshack26
npm ci
npm run dev
```

If you already have the repository, run `npm ci` and `npm run dev` from its root directory.

Open **[http://localhost:3000](http://localhost:3000)** in your browser. No environment variables, API keys, or database setup are required.

To use another port:

```bash
npm run dev -- --port 3001
```

### Run a production build

```bash
npm run build
npm start
```

The production server also defaults to port 3000. Stop the development server first, or use `npm start -- --port 3001`.

Development output lives in `.next-dev/`, while production output lives in `.next/`. Both directories are generated automatically and ignored by Git.

## How to play

1. **Set up your harvest.** Finish or skip the tutorial. In **My Crop Inventory**, choose a crop, enter its quantity in kilograms, and select **Add to inventory**. Repeat for additional crops. Starting inventory can be edited on Day 1 before your first sale.
2. **Reveal the day's event.** Choose one of the three scenario cards. Trading and advancing unlock after the reveal.
3. **Compare your options.** Select a crop from your inventory and enter a quantity in **Place a sell order**. Compare each buyer's net return for that exact quantity. Closed buyers, filled orders, and orders exceeding capacity or inventory are excluded from recommendations.
4. **Place a sale.** Choose a buyer, review the cost breakdown, and select **Confirm sale**. Each buyer accepts one order **per crop, per day**. Choosing another buyer preserves the comparison quantity; switching crops starts a fresh order form.
5. **Sell more or hold.** Select **Next Market Day** when you are ready. The confirmation previews storage costs, expected spoilage, and next-day freshness. Remaining stock is charged for storage before spoilage is removed.
6. **Finish the season.** You can still trade on Day 7. Select **End season** to see your results. Remaining stock has no salvage value, and there is no additional overnight charge after the final day.

Use **Reset game** or **Play again** to start a new season. Saves are specific to the browser and site address; they do not sync across devices.

## Understanding returns

```text
Gross revenue      = quantity × buyer price
Selling costs      = fixed delivery fee + quantity × handling cost per kg
Net return         = gross revenue − selling costs
Net selling margin = total gross revenue − total selling costs − total storage costs
```

A small order can lose money when delivery and handling exceed its revenue. The interface flags these cases, but the player can still place a valid loss-making order. Cash starts at $0 and can become negative.

Buyer prices combine the market base, channel multiplier, freshness, channel demand, and the selected daily scenario. Seeded markets and saved card choices keep quotes stable across reloads. The final benchmark compares your strategy with selling the initial crop inventory to the Day 1 wholesaler after selling costs; it excludes random scenario-card effects.

## Development commands

| Command                | Purpose                      |
| ---------------------- | ---------------------------- |
| `npm run dev`          | Start the development server |
| `npm run build`        | Create the production build  |
| `npm start`            | Serve the production build   |
| `npm test`             | Run the test suite           |
| `npm run test:watch`   | Run tests in watch mode      |
| `npm run typecheck`    | Check TypeScript types       |
| `npm run lint`         | Run ESLint                   |
| `npm run format:check` | Check formatting             |
| `npm run format`       | Apply Prettier formatting    |

Tests cover trading validation, fees and accounting, multi-crop inventory, buyer-return comparisons, daily transitions, scenario effects, pricing, save restoration, and tutorial positioning.

## Project structure

```text
app/                  App Router entry points and global styles
components/           Dashboard, inventory, trading, charts, events, results, and tutorial
data/                 Crop catalogue, scenario data, and market-provider interfaces
engine/               Game rules, portfolio management, comparisons, scoring, and save replay
features/pricing/     Pricing configuration, seeded simulation, breakdown UI, and tests
store/                Zustand game actions and persistence
types/                Shared TypeScript models
tests/                Engine, integration, and regression tests
docs/                 Player guide and supporting screenshots
```

Components collect input and display state; Zustand actions call the game engine. Saved games are restored by validating and replaying transactions and daily transitions rather than trusting cached balances.

For more detail, see the [player guide](docs/tutorial/README.md), [pricing module guide](features/pricing/README.md), and [change log](change.md).
