import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @param {string} phase @returns {import('next').NextConfig} */
export default function nextConfig(phase) {
  return {
    // Keep next build from replacing chunks used by an active next dev server.
    // These must be sibling folders: a production build clears its output tree.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
