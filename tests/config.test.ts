import { describe, expect, it } from "vitest";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants.js";
import { resolve, sep } from "node:path";
import nextConfig from "../next.config.mjs";

describe("Next.js build isolation", () => {
  it("keeps development chunks outside the production output tree", () => {
    const dev = resolve(nextConfig(PHASE_DEVELOPMENT_SERVER).distDir!);
    const production = resolve(nextConfig(PHASE_PRODUCTION_BUILD).distDir!);
    expect(dev).not.toBe(production);
    expect(dev.startsWith(production + sep)).toBe(false);
    expect(production.startsWith(dev + sep)).toBe(false);
  });

  it("serves production from the same directory used by the build", () => {
    expect(nextConfig(PHASE_PRODUCTION_SERVER).distDir).toBe(
      nextConfig(PHASE_PRODUCTION_BUILD).distDir,
    );
    expect(nextConfig(PHASE_PRODUCTION_SERVER).distDir).toBe(".next");
  });
});
