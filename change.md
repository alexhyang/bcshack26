# Changes

## Rename to FarmSmart

- Renamed the project package, browser title, desktop and mobile branding, loading screen, scenario card backs, footer, and documentation to FarmSmart.
- Retained the existing browser save key so saved seasons and inventory continue to load after the rename.
- Validation: all 243 tests, ESLint, TypeScript, formatting, and the production build pass. Verified the FarmSmart browser title, visible branding, scenario card backs, and existing saved inventory in the running app.

## Scenario reveal movement

- Temporarily hide both unchosen card backs while the selected card slides and expands from its original position into the centered half-width slot, then fade them back in after it settles.
- Respect reduced-motion preferences with immediate placement. Keep animation state local and release hidden backs if the animation is interrupted; saved choices and game rules are unchanged.
- Verified hidden card backs during movement, visible backs after settling, restored-save visibility, and the centered half-width result. TypeScript, ESLint, and production build pass.

## Centered chosen scenario card

- After revealing any of the three cards, the chosen card moves to the center and occupies 50% of the deck width. The other two stay face-down, one on either side.
- Kept this layout on phones with compact card backs and wrapping revealed-card details. Original card indices, saved choices, and event effects are preserved.
- Verified all three choices center correctly at exactly 50% of the deck width; the 390px phone layout has no horizontal overflow. TypeScript, ESLint, and the production build pass.

## Same-quantity buyer returns and multi-crop UI fixes

- Buyer cards now compare the quantity entered in the sell order, showing revenue, total selling costs, net return, and net per kg. The summary identifies the highest executable return and its advantage over the next available buyer; ties and all-loss orders are explicit.
- Closed buyers, filled orders, capacity limits, invalid quantities, unavailable inventory, pending scenarios, and completed seasons are excluded from recommendations. Quantities are never silently reduced to make a buyer eligible.
- Buyer selection preserves the comparison quantity. Switching crop, day, or season resets the order form and clears stale sale feedback. Sale confirmation identifies the crop and reports cash increases or decreases accurately.
- Results use the actual initial inventory for sold/spoiled/unsold bar proportions, including custom multi-crop harvests and zero inventory. Added an accessible text description of the bar.
- Validation: all 243 tests pass, including 13 comparison regressions; TypeScript, ESLint, formatting, and production build pass. Browser verification covered same-quantity execution, crop switching, capacity exclusions, loss warnings, and a 500 kg season ending with bar proportions of 30% sold, 13.844% spoiled, and 56.156% unsold. The 390px layout has no horizontal page overflow.

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

## Price chart visibility and vertical scaling

- Omitted zero-price observations from chart lines, fill, and tooltips. Closed buyers leave gaps instead of drawing zero-price drops.
- Automatically fit the vertical axis to positive prices in the selected period and visible channels, with a small margin so lines fill the chart area.
- Validation: TypeScript typecheck and ESLint passed.

## Corrected sidebar crop inventory

- Reverted the previous chart-based harvest selector and single-crop setup. Restored the prior scenario-card layout as requested.
- Replaced the carrot illustration in the left sidebar with a Crop dropdown, Quantity (kg) field, Add to inventory button, and an inventory list. The dropdown includes 42 crops grouped into vegetables, fruit and berries, grains and oilseeds, and pulses.
- Farmers can add several crops, add more kg to an existing crop, remove an entry, and select a crop from the list to view its prices and sell its stock. New users start with an empty inventory; existing saved stock is retained.
- Starting inventory is editable before the first sale. Selecting a crop never resets cash, trades, the current day, or the other crops. Each crop has its own stock and buyer orders; the shared daily scenario and market rules continue to apply.
- Storage, spoilage, inventory totals, results, and save replay account for all inventory entries. Transaction history identifies the sold crop. Included a compact inventory builder on smaller screens where the sidebar collapses.
- Validation: all 230 tests, TypeScript typecheck, ESLint, and the production build passed. Browser verification added 500 kg of apples and 250 kg of potatoes as separate sidebar entries and confirmed the 750 kg inventory and selected crop survive reload.

## Theme C — Modern Agricultural Exchange

- Replaced dark navy and neon accents with shared cream, ivory, forest, sage, harvest-orange, market-green, and terracotta theme tokens. Used darker companion shades for small text contrast.
- Bundled DM Sans and IBM Plex Mono locally, with their open-source licenses. Interface copy uses DM Sans; prices, quantities, percentages, and market statistics use IBM Plex Mono.
- Restyled the header, sidebar inventory, account cards, chart, buyer comparisons, trade form, history, results, dialogs, and tutorial. Reduced gradients, shadows, and corner radii; added restrained field-note detailing to scenario cards.
- Refined desktop, laptop, tablet, and mobile spacing, tables, form controls, and contrast while retaining existing navigation, focus states, and reduced-motion support.
- Visual changes only: game rules, inventory behavior, scenario selection/reveal, random events, multipliers, calculations, routes, state, and persistence are unchanged.

### Theme verification

- All 230 regression tests, ESLint, TypeScript typecheck, and the production build passed.
- Verified overview, sidebar inventory, tutorial, chart, price breakdown, simulated sale, trade history, and completed season results in the browser, including 390px phone, 768px tablet, and 1024px laptop layouts.
- Used a separate preview origin for interactive checks so the existing saved game stayed untouched; removed the temporary preview page afterward.
- Checked primary text and semantic text colors against ivory surfaces for accessible contrast. No simulation, store, data, or pricing-logic files changed; the route structure is unchanged.

## Reference-inspired forest and soil theme

- Adjusted the visual theme to match the supplied dashboard reference: taupe outer canvas, framed ivory workspace, deep forest sidebar, earthy soil-brown scenario panel, leafy green learning card, and berry-red action accents.
- Moved the desktop brand into the sidebar and aligned the header with the workspace using presentation-only layout changes. Kept the existing mobile header and navigation controls.
- Updated inventory tiles, account statistics, chart colors, cards, tables, and dialogs to the reference palette. Preserved existing scenario selection and reveal behavior.
- Game mechanics, calculations, data, routes, state management, and persistence are unchanged.
- Validation: all 230 tests, ESLint, TypeScript typecheck, and the production build passed. Visually checked desktop, 1024px laptop, 768px tablet, and 390px phone layouts; verified readable action, sidebar, and scenario text contrast and removed the temporary responsive preview page.
