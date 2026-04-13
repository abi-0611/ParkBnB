/**
 * Push required env vars from apps/web/.env.local to Vercel (production + preview).
 * Run from repo root: node scripts/push-vercel-env.mjs
 * Requires: pnpm dlx vercel (logged in), linked project (.vercel at root).
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, "apps", "web", ".env.local");

/** Canonical production URL for Auth.js (override with AUTH_URL in .env.local). */
const DEFAULT_AUTH_URL = "https://web-beta-blond-84.vercel.app";

const KEYS = [
  "AUTH_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_MAPBOX_TOKEN",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

function parseDotenv(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function sensitive(name) {
  return /SECRET|TOKEN|KEY|PASSWORD|PEPPER/i.test(name);
}

function runVercelEnvAdd(name, target, value, opts) {
  const args = [
    "dlx",
    "vercel",
    "env",
    "add",
    name,
    target,
    "--value",
    value,
    "--yes",
    "--force",
  ];
  if (opts.sensitive) args.push("--sensitive");
  const r = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!fs.existsSync(envPath)) {
  console.error("Missing apps/web/.env.local — create it first.");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const local = parseDotenv(raw);

for (const target of ["production", "preview"]) {
  console.log(`\n--- ${target} ---\n`);
  for (const key of KEYS) {
    const val = local[key];
    if (val == null || val === "") {
      console.warn(`Skip ${key} (empty)`);
      continue;
    }
    console.log(`Setting ${key}...`);
    runVercelEnvAdd(key, target, val, { sensitive: sensitive(key) });
  }
  const authUrl = local.AUTH_URL?.trim() || DEFAULT_AUTH_URL;
  console.log("Setting AUTH_URL...");
  runVercelEnvAdd("AUTH_URL", target, authUrl, { sensitive: false });
}

console.log("\nDone. Redeploy: pnpm dlx vercel deploy --prod --yes\n");
