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
