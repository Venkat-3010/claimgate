#!/usr/bin/env node
/**
 * Generates docs/assets/demo.svg — side-by-side PASS vs FAIL terminal demo.
 * Run: node scripts/generate-demo-svg.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "..", "docs", "assets", "demo.svg");

const W = 980;
const H = 520;
const PAD = 20;
const PANEL_GAP = 16;
const PANEL_W = (W - PAD * 2 - PANEL_GAP) / 2;
const PANEL_H = H - PAD * 2 - 48;
const HEADER_H = 36;
const LINE_H = 18;
const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

/** @param {string} s */
function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {string} title
 * @param {"pass"|"fail"} kind
 * @param {Array<{text: string, color?: string}>} lines
 */
function panel(x, y, w, h, title, kind, lines) {
  const accent = kind === "pass" ? "#3d9a6a" : "#c45c5c";
  const badgeBg = kind === "pass" ? "#1a3d2c" : "#3d1a1a";
  const badgeFg = kind === "pass" ? "#6ecf97" : "#f0a0a0";
  const badge = kind === "pass" ? "PASS" : "FAIL";

  const bodyLines = lines
    .map((ln, i) => {
      const cy = y + HEADER_H + 28 + i * LINE_H;
      const color = ln.color ?? "#c8cdd5";
      return `<text x="${x + 16}" y="${cy}" fill="${color}" font-family="${FONT}" font-size="12">${esc(ln.text)}</text>`;
    })
    .join("\n");

  return `
  <g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#14181f" stroke="#2a313c"/>
    <rect x="${x}" y="${y}" width="${w}" height="${HEADER_H}" rx="10" fill="#1a1f28"/>
    <rect x="${x}" y="${y + HEADER_H - 10}" width="${w}" height="10" fill="#1a1f28"/>
    <circle cx="${x + 16}" cy="${y + HEADER_H / 2}" r="4.5" fill="#e06c60"/>
    <circle cx="${x + 32}" cy="${y + HEADER_H / 2}" r="4.5" fill="#e0b060"/>
    <circle cx="${x + 48}" cy="${y + HEADER_H / 2}" r="4.5" fill="#6ecf97"/>
    <text x="${x + 68}" y="${y + HEADER_H / 2 + 4}" fill="#8b93a1" font-family="${FONT}" font-size="11">${esc(title)}</text>
    <rect x="${x + w - 64}" y="${y + 8}" width="48" height="20" rx="4" fill="${badgeBg}" stroke="${accent}"/>
    <text x="${x + w - 40}" y="${y + 22}" text-anchor="middle" fill="${badgeFg}" font-family="${FONT}" font-size="11" font-weight="700">${badge}</text>
    ${bodyLines}
  </g>`;
}

const passLines = [
  { text: "$ claimgate verify", color: "#8b93a1" },
  { text: "Evidence pack: .claimgate/packs/a1b2c3d4.json", color: "#6b7380" },
  { text: "" },
  { text: "Claimgate PASS  pack=a1b2c3d4", color: "#6ecf97" },
  { text: "  git a68b548 (main)", color: "#8b93a1" },
  { text: "" },
  { text: "  ✓ typecheck (typescript) — ok [412ms]", color: "#c8cdd5" },
  { text: "  ✓ unit-tests (vitest) — 4 passed [890ms]", color: "#c8cdd5" },
  { text: "  ✓ env — contract matched [18ms]", color: "#c8cdd5" },
  { text: "" },
  { text: "Don't trust the agent. Trust the evidence.", color: "#6b7380" },
];

const failLines = [
  { text: "$ claimgate verify", color: "#8b93a1" },
  { text: "Evidence pack: .claimgate/packs/e5f6a7b8.json", color: "#6b7380" },
  { text: "" },
  { text: "Claimgate FAIL  pack=e5f6a7b8", color: "#f0a0a0" },
  { text: "  git a68b548 (main) dirty", color: "#e0b060" },
  { text: "" },
  { text: "  ✓ typecheck (typescript) — ok [390ms]", color: "#c8cdd5" },
  { text: "  ✗ unit-tests (vitest) — new skips [720ms]", color: "#f0a0a0" },
  { text: "      • tests/promo.test.ts: it.skip", color: "#e06c60" },
  { text: "  ✗ env — missing keys [12ms]", color: "#f0a0a0" },
  { text: "      • STRIPE_SECRET_KEY missing", color: "#e06c60" },
  { text: "      • CHECKOUT_WEBHOOK_SECRET missing", color: "#e06c60" },
  { text: "" },
  { text: "Agent said green. Evidence says otherwise.", color: "#6b7380" },
];

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Claimgate verify: clean green PASS vs agent cheat FAIL">
  <title>Claimgate — PASS vs FAIL evidence demo</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0e1218"/>
      <stop offset="100%" stop-color="#151b24"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${PAD}" y="28" fill="#e8ecf1" font-family="Georgia, 'Times New Roman', serif" font-size="20" font-weight="700">Claimgate</text>
  <text x="${PAD + 118}" y="28" fill="#8b93a1" font-family="${FONT}" font-size="12">don't trust the agent · trust the evidence</text>
  ${panel(PAD, 44, PANEL_W, PANEL_H, "clean-green-api", "pass", passLines)}
  ${panel(PAD + PANEL_W + PANEL_GAP, 44, PANEL_W, PANEL_H, "agent-cheat-checkout", "fail", failLines)}
  <text x="${W / 2}" y="${H - 14}" text-anchor="middle" fill="#5a6270" font-family="${FONT}" font-size="11">examples/clean-green-api · examples/agent-cheat-checkout</text>
</svg>
`;

await mkdir(dirname(out), { recursive: true });
await writeFile(out, svg, "utf8");
console.log(`Wrote ${out}`);
