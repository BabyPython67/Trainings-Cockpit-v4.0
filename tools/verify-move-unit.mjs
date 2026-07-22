// Gezielte Verifikation der v7.13-Funktion "Einheit frei verschieben": eine offene Lauf-/Kraft-Einheit
// von früher in der Woche auf einen anderen Tag verschieben, Badges auf Quelle+Ziel prüfen, zurücknehmen,
// und sicherstellen, dass die bestehende Volleyball-Ausfallen-Ersatz-Funktion (w3-Fr-vb aus seed.mjs)
// davon unberührt bleibt (Regressionscheck laut workflows/ship-version.md-Fallstrick).
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SEED } from "./seed.mjs";

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.join(TOOLS_DIR, "..", "index.html");
const SHOTS_DIR = path.join(TOOLS_DIR, ".build", "shots");
mkdirSync(SHOTS_DIR, { recursive: true });

const server = createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(readFileSync(HTML)); }).listen(8362);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
const problems = [];

async function dayCard(main, dayLetter) {
  const heading = main.locator("div.font-display.font-bold", { hasText: new RegExp(`^${dayLetter}$`) });
  return heading.locator("xpath=ancestor::div[contains(@class,'overflow-hidden')][1]");
}

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme === "dark" ? "dark" : "light" });
  const page = await ctx.newPage();
  // Gleiches eingefrorenes Datum wie verify-app.mjs (Plan-Woche 3, Mittwoch) — SEED hat den einzigen
  // "done"-Eintrag von Woche 3 auf Montag ("w3-Mo-run"), Dienstag ist damit garantiert noch offen.
  await page.clock.install({ time: new Date("2026-07-15T09:00:00") });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  await page.addInitScript(([seed, th]) => { localStorage.setItem("trainings-cockpit-v1", JSON.stringify({ ...seed, theme: th })); }, [SEED, theme]);
  await page.goto("http://localhost:8362/");
  await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });
  await page.waitForTimeout(1000);

  const nav = page.locator("nav");
  const main = page.locator("main");
  const shot = async (name, opts = {}) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS_DIR, `${name}-${theme}.png`), fullPage: true, ...opts }); };

  await nav.getByRole("button", { name: "Woche", exact: true }).click();
  await page.waitForTimeout(400);

  // Dienstag ist in Woche 3 laut Seed noch offen (nur Montag ist "done") — Zeile aufklappen und den
  // neuen "Verschieben"-Button suchen.
  const diCard = await dayCard(main, "Di");
  const diRow = diCard.locator("div.transition").first();
  const diExpandBtn = diRow.locator("button").last();
  await diExpandBtn.click().catch(() => problems.push(theme + ": Dienstag-Zeile nicht aufklappbar"));
  await page.waitForTimeout(300);
  const moveBtn = diRow.getByRole("button", { name: "Verschieben", exact: true });
  if (!(await moveBtn.count())) { problems.push(theme + ": 'Verschieben'-Button an offener Dienstag-Einheit nicht gefunden"); await ctx.close(); continue; }
  const sourceLabel = (await diRow.locator("span.font-semibold").first().innerText()).trim();

  await moveBtn.click();
  await page.waitForTimeout(300);
  // Zieltag "So" wählen — an einem normalerweise leeren Ruhetag lässt sich die neue Kopie am klarsten prüfen.
  await diRow.locator("select").selectOption("So");
  await diRow.getByRole("button", { name: "Dorthin verschieben", exact: true }).click();
  await page.waitForTimeout(400);

  // Quelle: "Verschoben"-Badge + Zurücknehmen-Button, nicht mehr abhakbar
  if (!(await diRow.locator("text=Verschoben → So").count())) problems.push(theme + ": Quell-Zeile zeigt kein 'Verschoben → So'-Badge");
  await shot("10-woche-verschoben-quelle");

  // Ziel: So-Karte zeigt eine neue Zeile mit "Verschoben"-Badge und demselben Label
  const soCard = await dayCard(main, "So");
  const soRow = soCard.locator("div.transition", { hasText: sourceLabel });
  if (!(await soRow.count())) problems.push(theme + `: Ziel-Zeile (So) mit Label "${sourceLabel}" nicht gefunden`);
  else if (!(await soRow.locator("text=Verschoben von Di").count())) problems.push(theme + ": Ziel-Zeile zeigt kein 'Verschoben von Di'-Badge");
  await shot("11-woche-verschoben-ziel");

  // Zurücknehmen: Quelle wieder normal, Ziel-Kopie verschwindet
  await diRow.getByRole("button", { name: "Verschieben zurücknehmen", exact: true }).click();
  await page.waitForTimeout(400);
  if (await diRow.locator("text=Verschoben → So").count()) problems.push(theme + ": Quell-Zeile zeigt nach Zurücknehmen weiterhin das Verschoben-Badge");
  if (await (await dayCard(main, "So")).locator("div.transition", { hasText: sourceLabel }).count()) problems.push(theme + ": Ziel-Kopie (So) besteht nach Zurücknehmen weiter");

  // Regressionscheck: bestehende Volleyball-Ausfallen-Ersatz-Fixture (w3-Fr-vb) unverändert
  const frCard = await dayCard(main, "Fr");
  const cancelledRow = frCard.locator("div.transition", { hasText: "Ausgefallen" });
  if (!(await cancelledRow.count())) problems.push(theme + ": bestehende Ausfall-Zeile (Fr, VB) nach Verschieben-Feature-Änderungen nicht mehr vorhanden");
  const saCard = await dayCard(main, "Sa");
  if (!(await saCard.locator("text=Lockerer Ersatzlauf").count())) problems.push(theme + ": bestehende Ersatz-Einheit (Sa, 'Lockerer Ersatzlauf') nach Verschieben-Feature-Änderungen nicht mehr vorhanden");
  await shot("12-woche-regressioncheck-ausfall");

  if (errors.length) problems.push(`${theme}: ${errors.length} Konsolenfehler: ` + errors.slice(0, 3).join(" ;; "));
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) { console.log("PROBLEME:\n" + problems.join("\n")); process.exit(1); }
console.log("Verschieben-Verifikation ok — Screenshots in tools/.build/shots/");
