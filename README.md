# FarmStreet 🌱

A complete, browser-local agricultural market simulator. Build an inventory of Canadian-grown crops in the left sidebar and take it through seven Canadian market sessions: compare buyers, sell or hold inventory, absorb storage and spoilage costs, and review your strategy against an immediate-sale baseline.

All prices, buyers, news, weather, and market conditions are **simulated**. No accounts, API keys, real trades, payments, or backend are involved.

## Launch

Use Node.js 22 LTS or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The game starts with a complete scenario. Progress automatically saves in this browser’s localStorage. Reset Game clears the current season and starts fresh.

```bash
npm test               # 104 unit and state tests
npm run test:watch     # watch tests during development
npm run typecheck     # TypeScript checks
npm run lint          # Next.js, accessibility, and React lint rules
npm run format:check  # verify source formatting
npm run format        # format source files
npm run build         # optimized production build
npm start             # serve the production build
```

## How to play

A spotlight tour opens automatically every time you launch or reload the game, including when you resume a saved season. It highlights actual dashboard controls, scrolls them into view, and visits the real Trade History and Results pages. Use **Next** and **Back**, jump between steps, or press the always-visible **Skip tutorial** button at the top-right (Escape also skips). Skipping or finishing returns you to the game without changing your harvest or trades. The header’s book button reopens the tour from the beginning. See the [written tutorial](docs/tutorial/README.md) for a reference outside the game.

1. Compare today’s wholesale, retail, and restaurant offers. Each has its own capacity, delivery fee, and per-kg handling/packaging cost.
2. Select a buyer, enter kilograms (up to two decimal places), and review the full cost breakdown. Percent buttons use the smaller of remaining inventory and that buyer’s capacity.
3. Confirm the sale. Inventory and cash update immediately. Each buyer accepts **one order per day**, even if you do not use all its capacity.
4. Choose **Next Market Day**, review the holding costs, and advance. Storage is charged on remaining inventory **before** spoilage is removed. The current day’s displayed holding rates govern that overnight period.
5. Trade on Day 7, then choose **End season** to see your results. Advancing from Day 6 does not end the game. There is no extra storage charge after the final session.

Today’s buyer cards highlight the highest net return **per kg at each buyer’s maximum feasible quantity**. This is a comparison, not a guaranteed optimal strategy. Intraday chart traces are illustrative observations for days already revealed; actual orders execute at the daily buyer quote. Chart range and channel toggles work without exposing future sessions.

## Accounting and simulation rules

- **Gross revenue** = quantity × buyer price.
- **Selling costs** = fixed delivery fee + quantity × per-kg handling/packaging cost.
- **Net selling return per order** = gross revenue − selling costs.
- **Net selling margin / cash** = cumulative gross revenue − selling costs − storage costs.
- Currency and kilograms round to two decimal places. Variable fees and gross revenue round independently, then net return is calculated from those rounded amounts.
- A low-volume order can lose money because of its delivery fee. The preview warns you, but valid loss-making orders are allowed.
- Starting cash is $0. Storage and loss-making orders can produce a negative cash balance; this simulator does not impose a financing constraint.
- Freshness reduces buyer prices through the centralized crop- and channel-specific pricing formula. Spoilage independently removes kilograms from inventory. The existing freshness value is reused; there is no second freshness clock.
- Remaining inventory after the final session has **zero salvage value**. Results list spoiled and unsold quantities separately and in total.
- Production costs are excluded. **Net selling margin is not full farm profit.**
- Baseline: sell all 1,000 kg to the Day 1 wholesaler under the same opening conditions, after delivery and handling. Medium demand at the $1.12 market reference gives **$976**; new seasons can have a different baseline because opening demand is randomized. The benchmark excludes the random scenario card so a wholesale shutdown does not create an impossible comparison. Migrated seasons with original trades retain their original $976 baseline.

The scenario retains its restaurant capacity surge, bumper harvest, highway closure, grocery promotion, extreme heat, and supply shortage. Capacity, delivery/storage expenses, and spoilage remain driven by the existing scenario. Buyer prices now come from one formula: **market base × channel × freshness × demand × daily scenario**. Daily shocks update the market base; the revealed card applies its multiplier once and can close a buyer for that day. No future events or prices appear in the UI.

## Dynamic pricing

The feature is organized under [`features/pricing/`](features/pricing/README.md), including configuration, seeded daily simulation, pure calculations, selectors, UI, and tests. No dependencies were added.

- Open **Show Price Breakdown** above today’s buyer cards to compare every multiplier and the highest quoted price per kg.
- The market strip shows the current base price, actual daily base-price movement, and a HIGH/MEDIUM/LOW demand badge. Buyer quote movements in the chart also include freshness and demand.
- The breakdown contains a read-only market watch for lettuce, tomatoes, strawberries, and potatoes. Each crop receives independent daily demand and shock rolls; select a crop in your sidebar inventory to trade it.
- **Next Market Day** uses the existing day action, applies holding costs and freshness decay, generates one new saved market snapshot, and recalculates all quotes. Day 7 still ends through **End season**.
- New seasons get a random seed. Their market history is reproducible from that seed and does not reroll on rendering, trading, reopening the breakdown, or reloading.
- Existing saves migrate on load. Already executed transactions, balances, inventory, freshness, and day recaps retain their values. Dynamic pricing starts on the saved current day for subsequent orders. A legacy order already placed today still consumes that buyer’s one order for today.
- Providers explicitly marked `mode: "live"` bypass simulation pricing. No external data connection is present or required.

See the [feature guide](features/pricing/README.md) for balance settings, formulas, assumptions, and a step-by-step verification flow.

## Architecture

```text
app/                  Next.js App Router entry points, metadata, global theme
components/
  layout/             Dashboard shell, header, sidebar, session controls
  farm/               Inventory and cash metrics
  market/             Recharts history, channel quotes, buyer comparison
  trading/            Sell form, cost preview, transaction table
  events/             News, conditions, educational insights
  results/            Season results, baseline comparison, takeaways
  ui/                 Local shadcn/ui Button and Radix Dialog components
  tutorial/           Automatic spotlight tour, page targets, positioning, styles
features/pricing/     Dynamic pricing config, seeded simulation, breakdown UI, tests
engine/
  game.ts             Pure initialization and daily transitions
  trading.ts          Validation, cost preview, immutable order execution
  inventory.ts        Overnight storage, spoilage, freshness
  market.ts           Buyer lookup, capacity, price movements
  scoring.ts          Final accounting, baseline, contextual takeaways
  saves.ts            Validate and replay saved orders to restore state
data/
  scenarios.ts        Immutable fictional seven-day scenario and crop model
  market-provider.ts  MarketDataProvider contract
  simulated-provider.ts  Read-only current-day and revealed-history access
store/gameStore.ts    Zustand actions and localStorage persist middleware
types/game.ts         Shared TypeScript models
tests/                Trading, game-loop, accounting, persistence/reset tests
```

React components render and collect input. They invoke Zustand actions rather than mutate state. Actions call pure TypeScript engine functions; the provider supplies read-only daily market data. Only mutable game data persists. Hydration waits until the client loads, avoiding server/client mismatches. Save recovery replays validated transactions and daily transitions rather than trusting cached balances. Incompatible or invalid saves return to a fresh season.

`MarketDataProvider` is the replacement point for a future real-data adapter. A future `RealMarketProvider` can supply the same crop/day/history models; network fetching and data normalization should happen at that boundary. There is no live integration in this MVP.

## Verification

104 Vitest tests cover original trading/accounting, storage/spoilage, the seven-day loop, reset, saved-state recovery, tour positioning, build-output isolation, and 37 dynamic-pricing cases. Pricing tests verify the full freshness curve, lettuce’s 80% channel reversal, demand weights and exact bucket boundaries, crop-specific shock probabilities/magnitudes, 50/50 directions, price caps, daily stability, quote/preview/execution agreement, every crop’s daily rolls, seven-day replay, legacy migration, and live-provider isolation. Scenario integration checks cover all 12 cards, quote/execution agreement, closures, historical prices, pre-pricing save migration, and full-season replay.

The original fixed-price tests remain explicit legacy fixtures so migrated orders retain their original accounting. New pricing tests exercise the default dynamic game and exact persisted-state replay. Browser verification includes the actual dashboard, breakdown panel, a sale, advancement, and save/reload.

![FarmStreet dashboard](docs/farmstreet-dashboard.png)

## Development and production build folders

Development uses `.next-dev/`; `npm run build` and `npm start` use `.next/`. These are separate sibling folders so running a production build while the dev server is open cannot overwrite its JavaScript chunks. The setting lives in `next.config.mjs`. Both folders are generated and ignored by Git, ESLint, and Prettier.

If an older running server shows `a[d] is not a function`, missing-chunk errors, or a loading screen after a build, stop it with Ctrl+C, run `npm run dev` again, then reload the browser. The updated configuration prevents this shared-cache collision. Your game save lives in browser localStorage and is unaffected by rebuilding or restarting the server.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import it in Vercel and select the **Next.js** preset.
3. Use `npm run build` as the build command and the default output settings. Select Node.js 22.x or a later supported version.
4. Deploy. No environment variables or API credentials are required.

You can also run `npx vercel` from the repository if you already have a Vercel account. Deployment is not performed by this project setup.

## MVP scope

Multiple inventory crops, 42 simulated crop markets, a seven-day scenario with seeded market variation, three fictional buyer channels, and browser-local saves. Each order settles immediately; there are no in-transit shipments, financing costs, full production budgets, or inventory purchases. Refreshing preserves progress within the same browser and origin; saves do not sync between devices. If localStorage is blocked, the game remains playable in memory and displays a warning.

Built with Next.js App Router, React, TypeScript, Tailwind CSS v4, shadcn/ui patterns with Radix primitives, Recharts, Zustand persist, Lucide, and Vitest. The lockfile records the installed dependency versions.

### Daily scenario cards

At the start of every day, choose one of three randomly dealt face-down cards in the Scenario module. The chosen event applies only for that day; the other cards stay hidden. Trading and advancing are locked until a card is revealed.
Twelve fictional events cover frost, rain, heatwaves, a public-holiday restaurant shutdown, a wholesale strike, a food festival, bumper harvests, import restrictions and resumptions, school lunches, bridge closures, and supermarket promotions. Each event sets a separate price multiplier for wholesalers, retailers, and restaurants. Closed channels have zero buying capacity. Displayed prices, sale previews, transactions, and historical charts use the same adjusted daily prices; delivery costs are unchanged.
Hands and choices are saved with the season and validated when restoring orders. Reloading keeps the same draw. Older saved games retain original prices for days already traded; scenario cards begin with the next untraded session. Edit `engine/scenario.ts` to add events or tune their illustrative multipliers.

### Build your crop inventory

Buyer cards compare the quantity entered in **Place a sell order** across all three channels. Each eligible buyer shows revenue, delivery/handling costs, total net return, and net per kg. The summary highlights the best return and its advantage over the next buyer; unavailable orders and losses are explained. Selecting another buyer preserves your quantity, while changing crop or market day starts a fresh order form.

In the left sidebar, choose a crop, enter its quantity in kg, and click Add to inventory. Repeat to add different crops; adding the same crop increases its stock. Select any inventory row to view that crop's market and place sales. Remove entries with the × button while setting up. Starting quantities lock after your first sale; a new season restores the starting inventory and unlocks editing. Existing saves retain their stock. Prices are fictional simulation values.
