# Changes

## 2026-10-17 - Dynamic crop pricing

- Added the self-contained `features/pricing/` module with configurable crop sensitivity, buyer channel multipliers, daily demand, and capped market-price shocks for five crops.
- Centralized freshness-adjusted prices across buyer offers, charts, sale previews, executed orders, and the opening-day baseline.
- Added a responsive Show Price Breakdown dialog with the highest quote highlighted and a read-only market watch for other crops.
- Persisted seeded daily market snapshots so opening dialogs and reloading never reroll prices. Existing saves retain their executed trades and balances when migrating.
- Updated the tutorial, player documentation, and module guide; added a pricing preview screenshot and 37 regression tests.

### Validation

- All 83 tests passed before integrating remote changes.
- TypeScript, ESLint, formatting, and the production build passed.
- Browser checks covered mobile layout, price breakdowns, trading, daily market changes, reload persistence, and season completion.

## 2026-10-17 - Pricing and scenario integration

- Merged the remote daily scenario cards feature with dynamic pricing, preserving both modules and both change records.
- Applied the selected scenario exactly once across displayed quotes, price breakdowns, execution, and historical charts; closed buyers cannot accept orders.
- Preserved pre-pricing scenario orders during save migration, including mixed legacy and dynamic orders on the same day.
- Added the daily scenario multiplier and closed-buyer labels to the price breakdown. Updated the tutorial to explain revealing a card before trading.
- Kept the opening wholesale benchmark independent of random scenario cards, including wholesale shutdowns.
- Added 15 integration tests covering every scenario, closures, reloads, migration, and complete-season accounting. All 104 tests pass after the merge.
- TypeScript, ESLint, formatting, and the production build passed after integration; no merge markers or whitespace errors remain.

## 2026-10-17 - Daily scenario cards

- Added a Scenario module with three random face-down cards each day. Players reveal one card before trading or advancing; the other two remain hidden.
- Added 12 fictional events covering frost, rain, heatwaves, public holidays, restaurant closures, wholesale strikes, festivals, bumper harvests, import changes, school lunches, freight disruption, and grocery promotions.
- Applied buyer-specific price multipliers to offers, sale previews, executed orders, and historical charts. Restaurant and wholesale shutdowns set the affected buyer capacity to zero. Effects expire at the end of the day.
- Saved dealt cards and selected events, validated them during save restoration, and replayed transactions at the adjusted prices. Existing traded days in older saves retain their original pricing.
- Added scenario details to market intelligence and session recaps, responsive card styling, keyboard focus states, and reduced-motion support.
- Documented the feature and added regression tests for card dealing, locked choices, closures, price calculations, save restoration, and legacy saves.

### Validation

- All 52 tests passed across six test files.
- TypeScript typecheck and ESLint passed.
- Browser verification covered revealing a card, adjusted prices and previews, closed buyers, a new draw on the next day, and persistence after reload.

## Scenario card explanations

- Revealed cards now show each channel's buff or nerf, exact multiplier, percentage change, and a short scenario-specific explanation.
- Cards label their effect from the farmer's perspective: Positive when channels only improve, Negative when channels only worsen, and Mixed when some improve while others worsen. Closures count as negative channel effects.
- Added matching card colours and a wider revealed-card layout, with the selected card above the hidden cards on small screens.

## Peaceful days and scenario probabilities

- Each face-down card now has a 50% chance of “Today is a peaceful day”, with no effect on price and all channel multipliers at ×1.00.
- The 12 existing scenarios collectively share the remaining 50%, giving each a 1/24 (approximately 4.17%) chance of being selected through a hidden card position. These are per-draw probabilities, not a guaranteed quota over seven days.
- Peaceful outcomes may appear more than once in a hand. Track the chosen card position so only one card reveals; preserve hands and choices on reload, including older saves.
- Added probability, peaceful-price, and save-restoration regression tests.

### Latest local integration validation

- Integrated scenario summaries and 50% peaceful-day draws with the remote dynamic-pricing module.
- Preserved the scenario identifier used to prevent double application of price multipliers; updated the peaceful-day test to compare unchanged buyer offers while allowing this metadata.
- All 108 tests passed after integration, along with TypeScript typecheck and ESLint.

## Independent daily demand by buyer channel

- Wholesalers, retailers, and restaurants now roll demand independently for each crop and day: high (25%, ×1.20), medium (50%, ×1.00), or low (25%, ×0.85).
- A high-demand wholesaler and low-demand restaurant can occur on the same day. Channel demand feeds the same quotes, previews, orders, and history used by the pricing model.
- Added channel demand badges to buyer cards and separate demand levels in the price breakdown.
- Versioned demand simulation preserves prior saved quotes and transactions. Existing seasons adopt independent channel demand starting the next day; new seasons use it immediately. Seeded rolls remain stable on reload.

- Validation: all 110 tests passed, including opposite channel-demand levels and legacy-save migration; TypeScript typecheck and ESLint passed.
