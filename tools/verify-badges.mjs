// Gezielte Verifikation der v7.7-Hexagon-Medaille: Kompakt-Größe in der Leiter (mehrere Stufen
// nebeneinander sichtbar), Detail-Modal per Klick, sowie prefers-reduced-motion unterdrückt die
// Glow-/Glanz-Animationen (neue Animationsfläche, die vorher nicht existierte — s. workflows/ship-version.md).
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

const server = createServer((req, res) => { res.setHeader("content-type", "text/html; charset=utf-8"); res.end(readFileSync(HTML)); }).listen(8361);
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", headless: true });
const problems = [];

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-07-15T09:00:00") }); // s. verify-app.mjs: Plan-Woche 3 fixieren
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text()); });
  await page.addInitScript(([seed, th]) => { localStorage.setItem("trainings-cockpit-v1", JSON.stringify({ ...seed, theme: th })); }, [SEED, theme]);
  await page.goto("http://localhost:8361/");
  await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });
  await page.waitForTimeout(1200);

  // Rückblick & Fortschritt aufklappen (seit v7.5 standardmäßig eingeklappt, Abzeichen-Karte liegt darin)
  await page.getByRole("button", { name: /Rückblick & Fortschritt/ }).click();
  await page.waitForTimeout(400);
  const badgesCard = page.locator("text=Auszeichnungen").first().locator("xpath=ancestor::div[contains(@class,'p-4')][1]");
  await badgesCard.screenshot({ path: path.join(SHOTS_DIR, `badges-collapsed-${theme}.png`) }).catch(() => problems.push(`${theme}: Auszeichnungen-Karte nicht gefunden`));

  // Leiter aufklappen -> mehrere Stufen (Bronze..Platin) nebeneinander sichtbar
  await page.getByRole("button", { name: /Alle Auszeichnungen/ }).click().catch(() => problems.push(`${theme}: "Alle Auszeichnungen"-Button nicht gefunden`));
  await page.waitForTimeout(400);
  await badgesCard.screenshot({ path: path.join(SHOTS_DIR, `badges-ladder-${theme}.png`) });

  // Erste Kachel antippen -> Detail-Modal (103-157px-Variante)
  const firstTile = badgesCard.locator("button").filter({ hasText: "" }).first();
  const tileCount = await badgesCard.locator("button").count();
  if (tileCount > 1) {
    // Index 0 ist meist der "Leitern einklappen"-Toggle-Button selbst weiter unten im DOM-Baum nicht
    // enthalten (eigener Button außerhalb der Karte) — hier zählen nur BadgeTile-Buttons.
    await badgesCard.locator("button").nth(0).click();
    await page.waitForTimeout(400);
    const modalVisible = await page.locator("text=Schließen").count();
    if (!modalVisible) problems.push(`${theme}: Detail-Modal öffnet nicht nach Klick auf eine Medaille`);
    else await page.screenshot({ path: path.join(SHOTS_DIR, `badges-detail-${theme}.png`) });
    await page.getByRole("button", { name: "Schließen" }).click().catch(() => {});
  } else {
    problems.push(`${theme}: keine anklickbaren Abzeichen-Kacheln gefunden`);
  }

  if (errors.length) problems.push(`${theme}: ${errors.length} Konsolenfehler: ` + errors.slice(0, 3).join(" ;; "));
  await ctx.close();
}

// prefers-reduced-motion: Glow-/Glanz-Keyframes dürfen nicht laufen (globale Regel setzt animation:none)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date("2026-07-15T09:00:00") });
  await page.addInitScript(([seed]) => { localStorage.setItem("trainings-cockpit-v1", JSON.stringify({ ...seed, theme: "light" })); }, [SEED]);
  await page.goto("http://localhost:8361/");
  await page.waitForFunction(() => window.__mounted === true, null, { timeout: 15000 });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Rückblick & Fortschritt/ }).click();
  await page.waitForTimeout(400);
  const anyAnimated = await page.evaluate(() => {
    const els = [...document.querySelectorAll("*")];
    return els.some((el) => { const a = getComputedStyle(el).animationName; return a && a !== "none"; });
  });
  if (anyAnimated) problems.push("prefers-reduced-motion: mindestens ein Element hat trotzdem eine aktive animation-name");
  await ctx.close();
}

await browser.close();
server.close();
if (problems.length) { console.log("PROBLEME:\n" + problems.join("\n")); process.exit(1); }
console.log("Badge-Verifikation ok — Screenshots in tools/.build/shots/");
