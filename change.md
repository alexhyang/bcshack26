# Changes

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
