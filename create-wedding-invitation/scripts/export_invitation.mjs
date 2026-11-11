#!/usr/bin/env node
/** Export a generated wedding invitation to cover PNG, long PNG, and PDF. */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { posterHtml } from "./poster.mjs";

function parseArgs(argv) {
  const result = { formats: ["cover", "long", "pdf"], force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--site" || value === "--output" || value === "--formats") {
      result[value.slice(2)] = argv[++index];
    } else if (value === "--force") {
      result.force = true;
    } else if (value === "--help" || value === "-h") {
      result.help = true;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  if (typeof result.formats === "string") {
    result.formats = result.formats.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return result;
}

function loadPlaywright() {
  const attempts = [createRequire(import.meta.url)];
  const runtimeRoot = path.resolve(path.dirname(process.execPath), "..");
  attempts.push(createRequire(path.join(runtimeRoot, "package.json")));
  for (const require of attempts) {
    try {
      return require("playwright");
    } catch {}
  }
  throw new Error("Playwright is unavailable. Use the Codex bundled Node runtime or install Playwright explicitly.");
}

function browserExecutable() {
  const candidates = [
    process.env.WEDDING_BROWSER_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function staticServer(root) {
  const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg" };
  return http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = path.resolve(root, relative);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    fs.readFile(target, (error, content) => {
      if (error) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, { "Content-Type": mime[path.extname(target).toLowerCase()] || "application/octet-stream" });
      response.end(content);
    });
  });
}

async function ready(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}.controls,dialog{display:none!important}html{scroll-behavior:auto!important}" });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: export_invitation.mjs --site DIR --output DIR [--formats cover,long,pdf,poster] [--force]");
    return;
  }
  if (!args.site || !args.output) throw new Error("--site and --output are required");
  const site = path.resolve(args.site);
  const output = path.resolve(args.output);
  if (!fs.existsSync(path.join(site, "index.html"))) throw new Error(`Invitation index.html not found: ${site}`);
  const allowed = new Set(["cover", "long", "pdf", "poster"]);
  if (!args.formats.length || args.formats.some((format) => !allowed.has(format))) throw new Error("--formats accepts cover,long,pdf,poster");
  fs.mkdirSync(output, { recursive: true });
  const targets = {
    cover: path.join(output, "invitation-cover-1080x1920.png"),
    long: path.join(output, "invitation-long.png"),
    pdf: path.join(output, "invitation.pdf"),
    poster: path.join(output, "invitation-poster.png"),
  };
  if (!args.force) {
    const existing = args.formats.map((format) => targets[format]).filter((target) => fs.existsSync(target));
    if (existing.length) throw new Error(`Refusing to overwrite: ${existing.join(", ")}`);
  }

  const server = staticServer(site);
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/`;
  const { chromium } = loadPlaywright();
  const executablePath = browserExecutable();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath });
    if (args.formats.includes("poster")) {
      const data = JSON.parse(fs.readFileSync(path.join(site, "invitation.json"), "utf8"));
      const context = await browser.newContext({ viewport: {width:720,height:1280}, deviceScaleFactor:1.5 });
      const page = await context.newPage();
      await page.setContent(posterHtml(data, url), {waitUntil:"networkidle"});
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
      });
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= 720 &&
        [...document.querySelector('.poster').children].every(el => {
          const r = el.getBoundingClientRect(); return r.top >= 30 && r.bottom <= 1250 && r.left >= 24 && r.right <= 696;
        }));
      if (!fits) throw new Error("Poster does not fit one phone screen. Rebalance photo size and spacing or ask how to shorten optional copy; do not crop details.");
      await page.screenshot({path:targets.poster});
      await context.close();
    }
    if (args.formats.includes("cover")) {
      const context = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
      const page = await context.newPage();
      await ready(page, url);
      await page.addStyleTag({ content: "body{overflow:hidden!important}main>.scene:not(.cover){display:none!important}.cover{width:360px!important;height:640px!important;min-height:640px!important;padding:18px!important}.cover h1{font-size:42px!important;margin:.08em 0!important}.cover .couple{font-size:22px!important;margin:8px 0!important}.cover #invitation{margin:8px 0!important}.cover-photo{width:160px!important;margin:9px 0!important}.cover .meta{font-size:12px!important;margin:5px 0!important}.cover .primary{margin-top:7px!important;padding:8px 18px!important}" });
      await page.screenshot({ path: targets.cover });
      await context.close();
    }
    if (args.formats.includes("long")) {
      const context = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
      const page = await context.newPage();
      await ready(page, url);
      await page.addStyleTag({ content: ".film{display:grid!important;grid-template-columns:1fr!important;overflow:visible!important;padding-inline:10px!important}.film button{width:100%!important;flex:none!important}" });
      await page.screenshot({ path: targets.long, fullPage: true });
      await context.close();
    }
    if (args.formats.includes("pdf")) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await ready(page, url);
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: targets.pdf, format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  for (const format of args.formats) console.log(`Created: ${targets[format]}`);
}

main().catch((error) => { console.error(`error: ${error.message}`); process.exitCode = 1; });
