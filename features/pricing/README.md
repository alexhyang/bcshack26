# Dynamic crop pricing

This module extends the existing FarmStreet engine, Zustand save, dashboard, and seven-day loop. All market data is simulated. It adds no dependencies, backend, parallel day counter, or alternate freshness control.

## Files

| File                            | Responsibility                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `config.ts`                     | Channel parameters, crop sensitivities, reference prices, demand weights, and volatility |
| `types.ts`                      | Feature types and persisted market snapshots                                             |
| `random.ts`                     | Injectable weighted random selection, seeded generator, and new-season seed              |
| `pricing.ts`                    | Central freshness and final-price calculation; channel comparison                        |
| `simulation.ts`                 | Demand buckets and capped market-price shocks                                            |
| `market.ts`                     | Current/historical quotes, daily snapshots, migration activation, and provider isolation |
| `components/PriceBreakdown.tsx` | Breakdown dialog, demand badges, price movement, other-crop market watch                 |
| `pricing.css`                   | Responsive styling matching the dashboard                                                |
| `__tests__/pricing.test.ts`     | 37 pricing, simulation, integration, and migration tests                                 |

Integration changes live in `engine/game.ts`, `trading.ts`, `scoring.ts`, `saves.ts`, `store/gameStore.ts`, shared game/provider types, existing market/trading/news components, and tutorial text. `lib/numbers.ts` shares currency rounding with the existing engine.

## Existing files updated

- `types/game.ts`: crop sensitivity, optional quote breakdowns, and saved pricing state.
- `data/scenarios.ts`, `data/market-provider.ts`, `data/simulated-provider.ts`: retain the original price/capacity/cost source, crop metadata, and explicit simulation/live mode.
- `engine/game.ts`, `engine/trading.ts`, `engine/scoring.ts`, `engine/saves.ts`: initialize/advance markets, execute current quotes, compare the proper baseline, and migrate/replay saves.
- `store/gameStore.ts`: random new-season seeds, immediate opening-market persistence, and existing actions.
- `components/market/BuyerOffers.tsx`, `MarketWatch.tsx`, `PriceChart.tsx`: current quotes, demand/base movement, breakdown entry point, and revealed price history.
- `components/trading/SellPanel.tsx`, `components/events/NewsFeed.tsx`, `components/layout/GameDashboard.tsx`: current executable offer, consistent news, and the existing advance button renamed Next Market Day.
- `components/tutorial/steps.ts`, `docs/tutorial/README.md`, `README.md`: updated in-game guidance and documentation.
- `vitest.config.ts`, `tests/game.test.ts`, `tests/trading.test.ts`, `tests/saves.test.ts`: discover module-local tests and retain explicit original-season regression coverage.
- New shared helper `lib/numbers.ts`: currency rounding, re-exported from the existing trading module for compatibility.

## One price calculation

`calculateFinalPrice()` returns the full breakdown, including the final quote:

```text
f = clamp(existing game freshness, 0, 100) / 100
freshness multiplier = f × max(0, 1 − channel penalty × crop sensitivity × (1 − f))
combined multiplier = channel multiplier × freshness multiplier × demand multiplier
final price = roundToCents(market base × combined multiplier)
```

`getMarketForGame()` applies it to the scenario’s buyer offers. Charts, cards, and the sell preview read those quotes. `executeSale()` independently resolves the same quote at execution and records its price and multiplier breakdown, preventing a supplied stale or forged offer price from changing the result. Delivery/handling remain separate order expenses; they are not part of the price-per-kg formula.

The market base retains full precision through daily shocks. The dialog shows six decimal places for auditability and multiplier displays use four; only the executable final quote rounds to cents. The main dashboard presents base prices to two decimals.

At $3/kg, 80% lettuce freshness, and medium demand, restaurant offers round to **$1.81/kg**, retailer to **$2.05/kg**, and wholesaler to **$2.28/kg**. These values come from the actual formula.

## Balance settings

| Channel    | Multiplier | Freshness penalty |
| ---------- | ---------: | ----------------: |
| Restaurant |       1.35 |              2.20 |
| Retailer   |       1.14 |              1.25 |
| Wholesaler |       1.00 |              0.25 |

| Crop         | Sensitivity | Shock probability | Magnitude | Fictional reference CAD/kg |
| ------------ | ----------: | ----------------: | --------- | -------------------------: |
| Lettuce      |        1.00 |               55% | 4–12%     |                      $3.00 |
| Tomatoes     |        0.75 |               40% | 3–9%      |                      $3.40 |
| Strawberries |        1.15 |               65% | 5–15%     |                      $5.00 |
| Carrots      |        0.50 |               25% | 2–6%      |                      $1.12 |
| Potatoes     |        0.30 |               15% | 1–4%      |                      $0.90 |

Each crop independently receives high demand (25%, ×1.20), medium (50%, ×1.00), or low (25%, ×0.85). The same bucket applies to all of that crop’s buyer channels. Weighted selection uses cumulative weights and an injected random source returning `[0, 1)`.

Each new day rolls each crop’s shock probability. A shock has a 50/50 up/down direction and uniform magnitude in its configured range. The result compounds from the preceding market base and is capped at 60–160% of the crop’s original reference. No shock leaves that base unchanged. Actual displayed movement reflects any clipping at the caps. Prices/multipliers remain nonnegative; 0% freshness gives a $0 quote.

The first session generates demand at reference prices and has 0% daily movement. Shocks begin when advancing. Future days are not generated or displayed early.

## State and save compatibility

The existing `GameState.freshness` controls current prices. Snapshot freshness is a historical observation for charts, not another mutable freshness system. `advanceDay()` still applies the scenario’s existing inventory spoilage and storage costs; it also creates exactly one new market snapshot for every configured crop. Rendering, quoting, trading, opening/closing the dialog, and reloading never roll the market. The opening seed is persisted immediately after hydration, before the first trade, so even an untouched Day 1 survives reloads.

New seasons receive a random 32-bit seed. Pure initialization accepts an explicit seed (and uses a deterministic default) for reproducible tests. The store persists the seed, activation day, legacy-transaction count, and revealed snapshots under the existing `farmstreet-save` key/version.

Restoration validates metadata and rebuilds history from the seed while replaying orders. Existing version-1 saves without pricing are replayed at the original fixed prices first. Their cash, executed trades, inventory, freshness, summaries, and day are preserved. Dynamic pricing then starts on the saved current day. The number of original transactions ensures subsequent reloads continue to preserve those executed prices, including mixed original and dynamic orders on the same day. Already-used buyers remain filled until the next session.

A migrated season starts its current carrot base from that day’s original wholesale quote, within the reference caps. Other crops start at their fictional references. Earlier legacy chart observations remain unchanged. Completed original seasons keep their original accounting and cannot place new orders.

New-season baselines use the actual opening demand at 100% freshness. Migrated seasons with original executed orders retain the original baseline. At medium demand the original wholesale baseline is $976.

Existing scenario capacities, fees, weather, storage and spoilage remain authoritative. Its old price table is retained solely for replaying original trades. Dynamic news impacts show the actual recalculated quote/capacity; old price-event multipliers are not reapplied. Providers explicitly marked `mode: "live"` bypass this simulation module; no live integration has been introduced.

## Try it

```bash
npm run dev
npm test -- features/pricing
npm run typecheck
npm run lint
npm run build
```

1. Open the app and skip the tour. An existing save migrates automatically; you do not need to reset it.
2. Above **Today’s buyer offers**, check the market base, daily movement, and demand badge.
3. Open **Show Price Breakdown**. Compare all channel/freshness/demand/combined multipliers and the highlighted highest quote.
4. Review the other-crop watch in the same dialog. These are read-only simulated markets.
5. Close the dialog, choose a buyer, enter a quantity, and compare the preview against its quoted price. Confirming still charges the existing delivery and handling costs.
6. Choose **Next Market Day** and confirm. Remaining inventory incurs the usual storage/spoilage, freshness falls, demand regenerates, and shocks may change market bases.
7. Reopen the breakdown to inspect the new multipliers. Reload and skip the tour again: day, inventory, cash, quotes and demand should stay the same.

## Scope and extension

Carrots remain the single playable inventory from the existing MVP. All five configured crops have real daily demand/shock snapshots and appear in the read-only market watch. Add playable inventories separately if expanding gameplay later. Unknown existing crops get a default sensitivity of 0.65 (or their existing explicit value) and conservative default volatility rather than being removed.

Balance parameters are centralized in `config.ts`. Future balance changes should version the pricing/save rules before changing the interpretation of historical seeded seasons. No authentication, payments, network data, or extra persistence backend is involved.
