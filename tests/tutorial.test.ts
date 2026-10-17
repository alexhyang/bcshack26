import { describe, expect, it } from "vitest";
import { positionTourCard, spotlightRect } from "@/components/tutorial/positioning";

const desktop = { width: 1440, height: 900 };
const card = { width: 350, height: 280 };
describe("spotlight tour positioning", () => {
  it("uses space beside a narrow control without covering it", () => {
    const target = { left: 250, top: 240, width: 300, height: 200 };
    const placed = positionTourCard(target, desktop, card);
    expect(placed.side).toBe("right");
    expect(placed.left).toBeGreaterThan(target.left + target.width);
    expect(placed.left + placed.width).toBeLessThanOrEqual(desktop.width - 16);
  });
  it("places the explanation below a wide dashboard panel", () => {
    const target = { left: 220, top: 120, width: 1180, height: 130 };
    const placed = positionTourCard(target, desktop, card);
    expect(placed.side).toBe("bottom");
    expect(placed.top).toBeGreaterThan(target.top + target.height);
  });
  it("uses left-side space for controls along the right edge", () => {
    const placed = positionTourCard(
      { left: 1120, top: 300, width: 270, height: 200 },
      desktop,
      card,
    );
    expect(placed.side).toBe("left");
    expect(placed.left + placed.width).toBeLessThan(1120);
  });
  it("keeps the mobile card inside the viewport and below the skip action", () => {
    const mobile = { width: 356, height: 734 };
    const placed = positionTourCard({ left: 50, top: 20, width: 290, height: 200 }, mobile, card);
    expect(placed).toMatchObject({ side: "bottom", left: 16, width: 324 });
    expect(placed.top).toBeGreaterThanOrEqual(72);
    expect(placed.top + placed.height).toBe(mobile.height - 16);
  });
  it("falls back to a visible card when a section is temporarily absent or too large", () => {
    for (const target of [null, { left: 10, top: 10, width: 1420, height: 880 }]) {
      const placed = positionTourCard(target, desktop, card);
      expect(placed.left).toBeGreaterThanOrEqual(16);
      expect(placed.top).toBeGreaterThanOrEqual(72);
      expect(placed.left + placed.width).toBeLessThanOrEqual(1440 - 16);
      expect(placed.top + placed.height).toBeLessThanOrEqual(900 - 16);
    }
  });
  it("clips a partially offscreen highlight instead of rendering outside the viewport", () => {
    expect(
      spotlightRect({ left: -50, top: -20, width: 450, height: 900 }, { width: 356, height: 734 }),
    ).toEqual({ left: 4, top: 4, width: 348, height: 726 });
  });
});
