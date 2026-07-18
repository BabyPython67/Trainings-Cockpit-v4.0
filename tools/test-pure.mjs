// Pure-Function-Tests für Trainings-Cockpit v6.0 — läuft gegen die echte Quelldatei (via build-pure.sh)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "./.build/pure.mjs";

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ✓ " + name); };

console.log("parseHrTarget");
t("Bereich '130–138'", () => assert.deepEqual(M.parseHrTarget("130–138"), { lo: 130, hi: 138 }));
t("Bereich mit Bindestrich '162-172'", () => assert.deepEqual(M.parseHrTarget("162-172"), { lo: 162, hi: 172 }));
t("Obergrenze 'bis 196'", () => assert.deepEqual(M.parseHrTarget("bis 196"), { lo: null, hi: 196 }));
t("leer/Müll → null", () => { assert.equal(M.parseHrTarget(""), null); assert.equal(M.parseHrTarget("locker"), null); assert.equal(M.parseHrTarget(null), null); });

console.log("Kalender-Helfer");
t("monthGrid: 42 Zellen, Montag zuerst", () => {
  const g = M.monthGrid(new Date(2026, 6, 15)); // Juli 2026
  assert.equal(g.length, 42);
  assert.equal(g[0].getDay(), 1); // Montag
  assert.equal(M.toLocalISO(g[0]), "2026-06-29"); // 1. Juli = Mittwoch → Grid beginnt Mo 29.06.
});
t("weekGrid: 7 Tage ab Montag", () => {
  const g = M.weekGrid(new Date(2026, 6, 15)); // Mi 15.07.
  assert.equal(g.length, 7);
  assert.equal(M.toLocalISO(g[0]), "2026-07-13");
  assert.equal(M.toLocalISO(g[6]), "2026-07-19");
});
t("toLocalISO ohne UTC-Kippkante", () => assert.equal(M.toLocalISO(new Date(2026, 0, 1, 0, 30)), "2026-01-01"));
t("rawPlanWeekOf: innerhalb/außerhalb", () => {
  assert.equal(M.rawPlanWeekOf(new Date(2026, 5, 29), [], "fixed"), 1);
  assert.equal(M.rawPlanWeekOf(new Date(2026, 6, 14), [], "fixed"), 3);
  assert.equal(M.rawPlanWeekOf(new Date(2026, 4, 1), [], "fixed"), null);  // vor Planstart
  assert.equal(M.rawPlanWeekOf(new Date(2026, 11, 1), [], "fixed"), null); // nach Planende
});

console.log("planRunTargets");
t("Intervalle Woche 3: Pace 275 ±15, HF 180–188", () => {
  const r = M.planRunTargets("2026-07-14", "int", [], "fixed"); // Di der Woche 3
  assert.equal(r.week, 3);
  assert.equal(r.pace, 275);
  assert.equal(M.PACE_BAND_SEC, 15);
  assert.deepEqual(r.hr, { lo: 180, hi: 188 });
});
t("Easy Woche 1: kein Pace-Ziel, HF 130–138", () => {
  const r = M.planRunTargets("2026-06-29", "easy", [], "fixed");
  assert.equal(r.pace, null);
  assert.deepEqual(r.hr, { lo: 130, hi: 138 });
});
t("verschobener Lauf: typgleicher Lauf derselben Woche greift", () => {
  const r = M.planRunTargets("2026-07-15", "tempo", [], "fixed"); // Mi statt Do gelaufen
  assert.equal(r.pace, 315);
  assert.deepEqual(r.hr, { lo: 162, hi: 172 });
});
t("Testwoche: nur Obergrenze 196", () => {
  const r = M.planRunTargets("2026-10-14", "test", [], "fixed"); // Mi der Woche 16
  assert.equal(r.week, 16);
  assert.deepEqual(r.hr, { lo: null, hi: 196 });
});
t("außerhalb des Plans: alles null", () => {
  const r = M.planRunTargets("2026-05-01", "easy", [], "fixed");
  assert.equal(r.week, null); assert.equal(r.hr, null); assert.equal(r.pace, null);
});
t("hrTargetForType", () => {
  assert.deepEqual(M.hrTargetForType("tempo", 3).band, { lo: 162, hi: 172 });
  assert.equal(M.hrTargetForType("tempo", 3).label, "162–172");
  assert.equal(M.hrTargetForType("test", 3).band, null); // Woche 3 hat keinen Testlauf
});

console.log("Overrides (Ausfall + Ersatz)");
const W = 2; // Woche 2: regulär, kein Turnier
t("Basis: Woche 2 enthält w2-Mi-vb mit Last 6", () => {
  const plan = M.buildWeekPlan(W, undefined, undefined, [], "fixed");
  const vb = plan.flatMap((d) => d.items).find((i) => i.uid === "w2-Mi-vb");
  assert.ok(vb); assert.equal(vb.load, 6); assert.ok(!vb.cancelled);
});
t("Ausfall ohne Ersatz: Einheit bleibt sichtbar, Last 0, Wochenlast −6", () => {
  const ov = { "w2-Mi-vb": { status: "ausgefallen" } };
  const base = M.plannedWeekLoad(W, undefined, [], "fixed");
  const plan = M.buildWeekPlan(W, undefined, undefined, [], "fixed", ov);
  const vb = plan.flatMap((d) => d.items).find((i) => i.uid === "w2-Mi-vb");
  assert.ok(vb.cancelled); assert.equal(vb.load, 0);
  assert.equal(M.plannedWeekLoad(W, undefined, [], "fixed", ov), base - 6);
});
t("Ausfall mit Ersatz (Do, Last 4): Wochenlast −2, uid w2-Mi-vb-ersatz", () => {
  const ov = { "w2-Mi-vb": { status: "ausgefallen", replacement: { day: "Do", sport: "run", label: "Lockerer Ersatzlauf", dur: "30 Min", load: 4 } } };
  const base = M.plannedWeekLoad(W, undefined, [], "fixed");
  assert.equal(M.plannedWeekLoad(W, undefined, [], "fixed", ov), base - 2);
  const plan = M.buildWeekPlan(W, undefined, undefined, [], "fixed", ov);
  const ers = plan.find((d) => d.day === "Do").items.find((i) => i.replacement);
  assert.equal(ers.uid, "w2-Mi-vb-ersatz");
  assert.equal(ers.sport, "run"); assert.equal(ers.load, 4);
  assert.equal(ers.replacesUid, "w2-Mi-vb");
});
t("Ersatz-Last wird auf 1–9 geklemmt, Sport validiert", () => {
  const ov = { "w2-Mi-vb": { status: "ausgefallen", replacement: { day: "Do", sport: "strength", load: 99 } } };
  const plan = M.buildWeekPlan(W, undefined, undefined, [], "fixed", ov);
  assert.equal(plan.find((d) => d.day === "Do").items.find((i) => i.replacement).load, 9);
  const bad = { "w2-Mi-vb": { status: "ausgefallen", replacement: { day: "Xx", sport: "run", load: 4 } } };
  assert.ok(!M.buildWeekPlan(W, undefined, undefined, [], "fixed", bad).flatMap((d) => d.items).some((i) => i.replacement));
});
t("Overrides anderer Wochen wirken nicht", () => {
  const ov = { "w5-Mi-vb": { status: "ausgefallen" } };
  const plan = M.buildWeekPlan(W, undefined, undefined, [], "fixed", ov);
  assert.ok(!plan.flatMap((d) => d.items).some((i) => i.cancelled));
});
t("weekFulfilled: Ausfall zählt nicht, Ersatz muss abgehakt werden", () => {
  const ov = { "w2-Mi-vb": { status: "ausgefallen", replacement: { day: "Do", sport: "run", label: "Ersatzlauf", load: 4 } } };
  const items = M.buildWeekPlan(W, undefined, undefined, [], "fixed", ov).flatMap((d) => d.items).filter((i) => i.load > 0);
  const doneAll = {}; items.forEach((i) => (doneAll[i.uid] = true));
  assert.equal(M.weekFulfilled(W, doneAll, undefined, [], "fixed", ov), true);
  const doneOhneErsatz = { ...doneAll }; delete doneOhneErsatz["w2-Mi-vb-ersatz"];
  const quote = items.filter((i) => doneOhneErsatz[i.uid]).length / items.length;
  assert.equal(M.weekFulfilled(W, doneOhneErsatz, undefined, [], "fixed", ov), quote >= 0.8);
});
t("krank + Ersatz: Ersatz-Einheit erbt die Krank-Markierung des Tages", () => {
  const ill = [{ id: "i1", start: "2026-07-09", end: "2026-07-10", note: "" }]; // Do/Fr Woche 2
  const ov = { "w2-Mi-vb": { status: "ausgefallen", replacement: { day: "Do", sport: "run", label: "Ersatzlauf", load: 4 } } };
  const plan = M.buildWeekPlan(W, undefined, undefined, ill, "fixed", ov);
  const ers = plan.find((d) => d.day === "Do").items.find((i) => i.replacement);
  assert.equal(ers.illness, "sick");
});

console.log("Regression: bestehende Logik unverändert");
t("buildWeekPlan ohne overrides identisch zu v5.1-Aufruf", () => {
  const a = JSON.stringify(M.buildWeekPlan(3, undefined, undefined, [], "fixed"));
  const b = JSON.stringify(M.buildWeekPlan(3, undefined, undefined, [], "fixed", {}));
  assert.equal(a, b);
});
t("migrateDone: alte Positions-Keys → uids", () => {
  const r = M.migrateDone({ "2-Mi-0": true, "w3-Di-run": true });
  assert.equal(r.changed, true);
  assert.deepEqual(r.done, { "w2-Mi-vb": true, "w3-Di-run": true });
});
t("DEFAULT_DATA enthält overrides:{} und alle v5.1-Keys", () => {
  const k = Object.keys(M.DEFAULT_DATA);
  ["runLog", "strengthLog", "recoveryLog", "done", "prios", "theme", "vbSlots", "nutrition", "schoolLog", "illnessLog", "planEndMode", "overrides"].forEach((x) => assert.ok(k.includes(x), x));
});
t("targetPaceSec unverändert", () => {
  assert.equal(M.targetPaceSec("int", 3), 275);
  assert.equal(M.targetPaceSec("int", 9), 280);
  assert.equal(M.targetPaceSec("tempo", 1), 315);
  assert.equal(M.targetPaceSec("easy", 1), null);
});

console.log("Schule");
t("groupByFach: alphabetisch, Ohne Fach zuletzt, innerhalb nach Fälligkeit", () => {
  const list = [
    { id: "1", titel: "b", fach: "Mathe", faelligkeit: "2026-07-20" },
    { id: "2", titel: "a", fach: "Mathe", faelligkeit: "2026-07-14" },
    { id: "3", titel: "c", fach: "", faelligkeit: "2026-07-15" },
    { id: "4", titel: "d", fach: "Bio", faelligkeit: "2026-07-16" },
  ];
  const g = M.groupByFach(list);
  assert.deepEqual(g.map((x) => x.fach), ["Bio", "Mathe", "Ohne Fach"]);
  assert.deepEqual(g[1].items.map((x) => x.id), ["2", "1"]);
});

console.log("v5.0-Bugfix: Krank-Text ohne 'undefined'");
t("VB-Einheit krank: desc beginnt nicht mit 'undefined'", () => {
  const ill = [{ id: "x", start: "2026-07-08", end: "2026-07-09", note: "" }];
  const vb = M.buildWeekPlan(2, undefined, undefined, ill, "fixed").find((d) => d.day === "Mi").items.find((i) => i.sport === "vb");
  assert.equal(vb.illness, "sick");
  assert.ok(!/undefined/.test(vb.desc), vb.desc);
  assert.ok(vb.desc.startsWith("Krank gemeldet"));
});

console.log("secToMMSS-Rundung (v5.1-Bugfix)");
t("359,7 s → 6:00 (nicht 5:60)", () => assert.equal(M.secToMMSS(359.7), "6:00"));
t("normale Werte unverändert", () => { assert.equal(M.secToMMSS(275), "4:35"); assert.equal(M.secToMMSS(0), "0:00"); assert.equal(M.secToMMSS(null), "—"); });

console.log("chipSide");
t("rechts nah, links frei → Links-Anker", () => assert.equal(M.chipSide([5, 5, 5, 7.9, 8.1, 7.8], 8, 4), "aboveLeft"));
t("Datenlinie weit weg → Standard", () => assert.equal(M.chipSide([5, 5.2, 5.1], 8, 4, "below"), "below"));
t("beide Seiten nah → Standard rechts (Chip liegt dank Hintergrund über der Linie)", () => assert.equal(M.chipSide([8, 8.1, 7.9, 8, 8.1, 8], 8, 4), "above"));
t("null-Werte werden ignoriert", () => assert.equal(M.chipSide([null, 5, null], 8, 4), "above"));

console.log("applyTimeRange (v6.2)");
const rowsAt = (isos) => isos.map((iso, i) => ({ iso, v: i }));
const todayIso = () => new Date().toISOString().slice(0, 10);
const daysAgoIso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
t("u10: letzte 10 Zeilen, unabhängig vom Datum", () => {
  const rows = rowsAt(Array.from({ length: 15 }, (_, i) => daysAgoIso(15 - i)));
  assert.equal(M.applyTimeRange(rows, "u10").length, 10);
  assert.equal(M.applyTimeRange(rows, "u10")[9].v, 14);
});
t("d14: nur Zeilen der letzten 14 Tage", () => {
  const rows = rowsAt([daysAgoIso(20), daysAgoIso(13), daysAgoIso(1), todayIso()]);
  const r = M.applyTimeRange(rows, "d14");
  assert.equal(r.length, 3);
});
t("all: unverändert", () => { const rows = rowsAt([daysAgoIso(400), todayIso()]); assert.equal(M.applyTimeRange(rows, "all").length, 2); assert.equal(M.applyTimeRange(rows, null).length, 2); });
t("leere Liste bleibt leer", () => assert.deepEqual(M.applyTimeRange([], "d30"), []));
t("Grenzfall exakt am Cutoff zählt noch dazu", () => { const rows = rowsAt([daysAgoIso(30)]); assert.equal(M.applyTimeRange(rows, "d30").length, 1); });

console.log("decouplingPct (v6.2)");
t("klarer Drift: Effizienz sinkt in 2. Hälfte → positiver Wert", () => {
  const rows = [{ pace: 300, hr: 150 }, { pace: 300, hr: 150 }, { pace: 300, hr: 170 }, { pace: 300, hr: 175 }];
  const d = M.decouplingPct(rows);
  assert.ok(d > 0, `erwartet >0, war ${d}`);
});
t("stabil: kaum Unterschied → nahe 0", () => {
  const rows = [{ pace: 300, hr: 150 }, { pace: 300, hr: 151 }, { pace: 300, hr: 150 }, { pace: 300, hr: 151 }];
  assert.ok(Math.abs(M.decouplingPct(rows)) < 2);
});
t("Effizienz steigt: negativer Wert", () => {
  const rows = [{ pace: 300, hr: 175 }, { pace: 300, hr: 170 }, { pace: 300, hr: 150 }, { pace: 300, hr: 150 }];
  assert.ok(M.decouplingPct(rows) < 0);
});
t("<4 nutzbare Runden → null", () => { assert.equal(M.decouplingPct([{ pace: 300, hr: 150 }, { pace: 300, hr: 150 }]), null); });
t("fehlender Puls wird ignoriert (< 4 valide → null)", () => { assert.equal(M.decouplingPct([{ pace: 300, hr: null }, { pace: 300, hr: 150 }, { pace: 300, hr: null }]), null); });

console.log("runPlanProgress (v6.2) — 58 ist nur der Basisfall, NIE hartkodieren");
t("ohne Krankheit: 58 in beiden Modi", () => {
  assert.equal(M.runPlanProgress([], "fixed").total, 58);
  assert.equal(M.runPlanProgress([], "dynamic").total, 58);
});
t("Krankheit trifft volle Regen-Woche (Woche 4), dynamic: 65 (Nachhol-Effekt, NICHT 58)", () => {
  const ill = [{ id: "i1", start: "2026-07-20", end: "2026-07-26", note: "" }];
  assert.equal(M.runPlanProgress(ill, "dynamic").total, 65);
});
t("dieselbe Krankheit, fixed: 57 (< 58, echte Kürzung am Planende)", () => {
  const ill = [{ id: "i1", start: "2026-07-20", end: "2026-07-26", note: "" }];
  const t1 = M.runPlanProgress(ill, "fixed").total;
  assert.ok(t1 < 58, `erwartet <58, war ${t1}`);
  assert.equal(t1, 57);
});
t("uids sind eindeutig und alle w{n}-{Tag}-run-Muster", () => {
  const r = M.runPlanProgress([], "fixed");
  assert.equal(new Set(r.uids).size, r.uids.length);
  assert.ok(r.uids.every((u) => /^w\d+-(Mo|Di|Mi|Do|Fr|Sa|So)-run$/.test(u)));
});

console.log("extractLaps: hrMax aus echter Garmin-CSV (v6.4)");
{
  // Simpler CSV-Parser fürs Test-Fixture: alle Felder sind quote-delimitiert ohne eingebettete Quotes/Kommas.
  const parseSimpleCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const cells = (line) => line.slice(1, -1).split('","');
    const header = cells(lines[0]);
    return lines.slice(1).map((line) => Object.fromEntries(header.map((h, i) => [h, cells(line)[i]])));
  };
  const csv = readFileSync(new URL("./fixtures/activity_23427253834_2.csv", import.meta.url), "utf8");
  const rows = parseSimpleCsv(csv);
  const laps = M.extractLaps(rows);
  const work = laps.filter((l) => [2, 4, 6, 8, 10].includes(l.lap));
  t("5 Arbeitsrunden erkannt (Laufen-Abschnitte)", () => assert.equal(work.length, 5));
  t("hr (Durchschnitt) korrekt aus 'Ø Herzfrequenz'", () => {
    assert.deepEqual(work.map((l) => l.hr), [158, 162, 159, 162, 170]);
  });
  t("hrMax korrekt aus 'Maximale Herzfrequenz' (bisher ungenutzte Spalte)", () => {
    assert.deepEqual(work.map((l) => l.hrMax), [178, 181, 181, 185, 186]);
  });
  t("Pause-/Warm-up/Cool-Down-Zeilen bleiben draußen (nur 'Laufen'-Abschnitte)", () => {
    assert.ok(laps.every((l) => [2, 4, 6, 8, 10].includes(l.lap)));
  });
}

console.log("v7.2: Kadenz/Schrittlänge pro Runde + Ausreißer-Erkennung über 'Zeit in Bewegung'");
{
  const parseSimpleCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const cells = (line) => line.slice(1, -1).split('","');
    const header = cells(lines[0]);
    return lines.slice(1).map((line) => Object.fromEntries(header.map((h, i) => [h, cells(line)[i]])));
  };
  const csv = readFileSync(new URL("./fixtures/activity_23580207957_easy1307.csv", import.meta.url), "utf8");
  const laps = M.extractLaps(parseSimpleCsv(csv));
  t("Ø Schrittfrequenz (Laufen)/Ø Schrittlänge werden pro Runde eingelesen (bislang nur aus der Gesamtzeile)", () => {
    const r2 = laps.find((l) => l.lap === 2);
    assert.equal(r2.cadence, 158);
    assert.equal(r2.strideLen, 0.9);
  });
  t("echte Runden ohne nennenswerten Stopp: hasStop=false, Pace unverändert aus 'Zeit'", () => {
    assert.ok(laps.every((l) => !l.hasStop), JSON.stringify(laps.filter((l) => l.hasStop)));
  });
}
t("extractLaps: 'Zeit in Bewegung' deutlich unter Rundenzeit -> hasStop, Pace aus Bewegungszeit", () => {
  const row = { "Abschnitttyp": "Laufen", "Runde": "5", "Distanz": "1.00", "Zeit": "8:00.0", "Zeit in Bewegung": "6:00.0" };
  const [lap] = M.extractLaps([row]);
  assert.equal(lap.hasStop, true);
  assert.equal(lap.pace, 360); // 6:00 Bewegungszeit / 1 km, nicht 8:00 (Rundenzeit)
});
t("extractLaps: normale Abweichung (<10%) löst keinen Ausreißer aus", () => {
  const row = { "Abschnitttyp": "Laufen", "Runde": "5", "Distanz": "1.00", "Zeit": "8:00.0", "Zeit in Bewegung": "7:20.0" };
  const [lap] = M.extractLaps([row]);
  assert.equal(lap.hasStop, false);
  assert.equal(lap.pace, 480);
});
t("extractLaps: ohne 'Zeit in Bewegung'-Spalte (älterer Export) nie hasStop", () => {
  const row = { "Abschnitttyp": "Laufen", "Runde": "5", "Distanz": "1.00", "Zeit": "8:00.0" };
  const [lap] = M.extractLaps([row]);
  assert.equal(lap.hasStop, false);
  assert.equal(lap.pace, 480);
});
t("aggregateLaps: Ausreißer-Runde bleibt in Distanz/Dauer, fliegt aber aus HF-/Kadenz-Schnitt", () => {
  const laps = [
    { lap: 2, dist: 1, sec: 300, pace: 300, hr: 140, cadence: 160, strideLen: 1.0, hasStop: false },
    { lap: 3, dist: 1, sec: 300, pace: 400, hr: 90, cadence: 100, strideLen: 0.5, hasStop: true }, // Ampel-Runde
    { lap: 4, dist: 1, sec: 300, pace: 300, hr: 142, cadence: 162, strideLen: 1.02, hasStop: false },
  ];
  const a = M.aggregateLaps(laps);
  assert.equal(a.dist, 3);
  assert.equal(a.sec, 900); // Dauer bleibt die volle Rundenzeit, auch bei der Ampel-Runde
  assert.equal(Math.round(a.pace * 100), Math.round(((300 + 400 + 300) / 3) * 100)); // Pace nutzt die (schon korrigierte) l.pace
  assert.equal(a.hr, 141); // Ø nur aus Runde 2+4 — Runde 3 (Ampel) zählt nicht mit
  assert.equal(a.cadence, 161);
  assert.deepEqual(a.outliers, [3]);
});
t("runEffort (Intervalle): eine stopp-korrigierte, künstlich schnelle Pace darf die Arbeit/Pause-Einteilung nicht kippen", () => {
  // 5 reale Intervall-Runden ~275-285 s/km (Screenshot-Fall 30.06.); Runde 6 hatte einen Ampel-Stopp und
  // wurde dadurch auf eine unrealistisch schnelle Anzeige-Pace korrigiert (188 s/km) — ohne rawPace-Fix in
  // classifyLaps würde sie fälschlich zum neuen Cluster-Bestwert und die 4 echten Arbeitsrunden als "Pause"
  // einstufen (visuell im Browser reproduziert: "1× Arbeit" statt "5×").
  const laps = [
    { lap: 2, dist: 0.8, sec: 224, pace: 280, rawPace: 280, hr: 158, hasStop: false },
    { lap: 4, dist: 0.8, sec: 221.6, pace: 277, rawPace: 277, hr: 162, hasStop: false },
    { lap: 6, dist: 0.8, sec: 227.8, pace: 187.5, rawPace: 284.75, hr: 159, hasStop: true }, // Ampel-Stopp
    { lap: 8, dist: 0.8, sec: 221.2, pace: 276.5, rawPace: 276.5, hr: 162, hasStop: false },
    { lap: 10, dist: 0.8, sec: 226.7, pace: 283.4, rawPace: 283.4, hr: 170, hasStop: false },
  ];
  const eff = M.runEffort({ type: "int", laps, dist: 4, sec: 1121.3, pace: 280 });
  assert.equal(eff.reps, 5, "alle 5 Runden müssen weiter als Arbeit erkannt werden");
  assert.ok(eff.work.has(6), "Ampel-Runde bleibt Teil der Arbeit (nur ihre HF fliegt aus dem Schnitt)");
});
t("classifyLaps: dieselbe Ausschluss-Logik gilt für Arbeitsrunden bei Intervallen", () => {
  const laps = [
    { lap: 2, dist: 0.8, sec: 220, pace: 275, hr: 160, hasStop: false },
    { lap: 3, dist: 0.15, sec: 120, pace: 800, hr: 130, hasStop: false }, // Erholung (langsam) — kein Arbeit
    { lap: 4, dist: 0.8, sec: 280, pace: 300, hr: 100, hasStop: true }, // Arbeitsrunde (pace im Cluster) mit Ampel-Stopp
  ];
  const c = M.classifyLaps(laps);
  assert.deepEqual(c.outliers, [4]);
  assert.equal(c.hr, 160); // Runde 4 (Ampel) fließt nicht in den HF-Schnitt der Arbeitsrunden ein
});
t("lifetimeStats: Arbeitsdistanz/-zeit summieren runEffort() über alle Läufe", () => {
  const runs = [
    { id: "a", date: "2026-07-01", type: "easy", dist: 5, sec: 1800, pace: 360 }, // ohne Runden -> Rückfall auf Gesamt
    { id: "b", date: "2026-07-02", type: "long", dist: 5, sec: 1800, pace: 360, laps: [
      { lap: 2, dist: 1, sec: 300, pace: 300, hr: 140, hasStop: false },
      { lap: 3, dist: 1, sec: 300, pace: 300, hr: 141, hasStop: false },
    ] },
  ];
  const s = M.lifetimeStats(runs, {});
  assert.equal(s.totalWorkKm, 7); // 5 (Rückfall) + 2 (Arbeitsabschnitt aus den Runden)
  assert.equal(s.totalWorkSec, 1800 + 600);
});
t("pulseTrendRows: Ausreißer-Runde bleibt neutral statt fälschlich in/out bewertet zu werden", () => {
  const rows = [
    { lap: 2, hr: 145, hrMax: 150, isWork: true, isFirstWork: true, hasStop: false },
    { lap: 3, hr: 90, hrMax: 95, isWork: true, isFirstWork: false, hasStop: true }, // Ampel — HF künstlich niedrig
  ];
  const out = M.pulseTrendRows(rows, "long", { lo: 140, hi: 155 });
  assert.equal(out[1].status, "neutral"); // ohne den Fix wäre das fälschlich "out" (90 < 140)
});

console.log("hrPeakStatus (v6.4) — Peak-mit-Marge statt Durchschnitt, echte Werte aus dem Screenshot-Lauf");
t("erste Arbeitsrunde immer neutral, unabhängig vom Wert", () => {
  assert.equal(M.hrPeakStatus(158, 178, true, { lo: 180, hi: 188 }), "neutral");
  assert.equal(M.hrPeakStatus(999, 999, true, { lo: 180, hi: 188 }), "neutral");
});
t("ohne Zielbereich immer neutral", () => assert.equal(M.hrPeakStatus(170, 186, false, null), "neutral"));
t("Peak knapp unter Ziel minus Marge → out (Runde 4: Ø162/Max181, Ziel 180-188)", () => {
  assert.equal(M.hrPeakStatus(162, 181, false, { lo: 180, hi: 188 }), "out");
});
t("Peak minus Marge erreicht Ziel → in (Runde 8: Ø162/Max185)", () => {
  assert.equal(M.hrPeakStatus(162, 185, false, { lo: 180, hi: 188 }), "in");
});
t("Peak minus Marge erreicht Ziel → in (Runde 10: Ø170/Max186)", () => {
  assert.equal(M.hrPeakStatus(170, 186, false, { lo: 180, hi: 188 }), "in");
});
t("ohne hrMax: Fallback auf Durchschnitt", () => {
  assert.equal(M.hrPeakStatus(185, null, false, { lo: 180, hi: 188 }), "in");
  assert.equal(M.hrPeakStatus(150, null, false, { lo: 180, hi: 188 }), "out");
});
t("nur Obergrenze (Test-Lauf 'bis X'): Marge zieht ab, nicht dazu", () => {
  assert.equal(M.hrPeakStatus(150, 200, false, { lo: null, hi: 196 }), "in"); // 200-5=195 <= 196
  assert.equal(M.hrPeakStatus(150, 205, false, { lo: null, hi: 196 }), "out"); // 205-5=200 > 196
});
t("weder hr noch hrMax vorhanden → neutral", () => assert.equal(M.hrPeakStatus(null, null, false, { lo: 180, hi: 188 }), "neutral"));

console.log("v7.0 Bugfix A: Aufbau nach Krankheit greift wirklich ein (nicht nur Text)");
t("Ramp-Tempo/-Intervalle werden zur Easy-Einheit der Woche (Woche 2, Krank-Ende Mo 06.07.)", () => {
  const ill = [{ id: "i1", start: "2026-07-04", end: "2026-07-06", note: "" }]; // Ramp: Di 07. – Do 09.07.
  const plan = M.buildWeekPlan(2, undefined, undefined, ill, "fixed");
  const di = plan.find((d) => d.day === "Di").items.find((i) => i.sport === "run");
  const doo = plan.find((d) => d.day === "Do").items.find((i) => i.sport === "run");
  [di, doo].forEach((it) => {
    assert.equal(it.illness, "ramp");
    assert.equal(it.type, "easy");
    assert.equal(it.hr, "130–138"); // Easy-Band der Wochen 1–3, nicht mehr 180–188/162–172
    assert.equal(it.load, 3);
    assert.ok(!/@\s*\d/.test(it.desc), it.desc); // kein hartes Pace-Ziel mehr im Text
    assert.ok(it.desc.startsWith("Aufbau nach Krankheit"));
  });
  assert.equal(di.uid, "w2-Di-run"); // uid bleibt stabil — Häkchen gehen nicht verloren
});
t("Ramp-Kraft wird zum Mobility-Block (Woche 2, Krank-Ende So 05.07.)", () => {
  const ill = [{ id: "i1", start: "2026-07-03", end: "2026-07-05", note: "" }]; // Ramp: Mo 06. – Mi 08.07.
  const st = M.buildWeekPlan(2, undefined, undefined, ill, "fixed").find((d) => d.day === "Mo").items.find((i) => i.sport === "strength");
  assert.equal(st.illness, "ramp");
  assert.equal(st.label, M.STRENGTH.mobility.title);
  assert.deepEqual(st.ex, M.STRENGTH.mobility.ex);
  assert.equal(st.load, M.STRENGTH.mobility.load);
  assert.ok(st.uid.startsWith("w2-Mo-str-")); // uid bleibt die der ursprünglichen Einheit
});
t("Easy/Langer Lauf bleiben im Ramp unverändert", () => {
  const ill = [{ id: "i1", start: "2026-07-08", end: "2026-07-09", note: "" }]; // Ramp: Fr–So → Sa = Langer Lauf
  const sa = M.buildWeekPlan(2, undefined, undefined, ill, "fixed").find((d) => d.day === "Sa").items.find((i) => i.sport === "run");
  assert.equal(sa.type, "long");
  assert.equal(sa.illness, undefined);
  assert.equal(sa.load, 6);
});
t("Turniertag krank: Text ersetzt statt angehängt — kein Widerspruch mehr", () => {
  const ill = [{ id: "i1", start: "2026-07-14", end: "2026-07-16", note: "" }];
  const tour = M.buildWeekPlan(3, undefined, undefined, ill, "fixed").flatMap((d) => d.items).find((i) => i.tournament);
  assert.equal(tour.illness, "sick");
  assert.ok(!tour.desc.includes("Pause empfohlen"), tour.desc);
  assert.ok(!tour.desc.includes("Schule · Bestleistung anstreben"), tour.desc);
  assert.ok(tour.desc.includes("in Absprache") && tour.desc.includes("Vorsicht"), tour.desc);
});
t("normale Einheiten krank: bisheriger Text unverändert", () => {
  const ill = [{ id: "i1", start: "2026-07-08", end: "2026-07-09", note: "" }];
  const vb = M.buildWeekPlan(2, undefined, undefined, ill, "fixed").find((d) => d.day === "Mi").items.find((i) => i.sport === "vb");
  assert.ok(vb.desc.startsWith("Krank gemeldet — Pause empfohlen"));
});

console.log("v7.0 Bugfix B: pulseTrendRows — geplotteter Wert = bewerteter Wert");
t("Intervalle: Arbeitsrunden plotten Peak−Marge, Farbe passt zum geplotteten Wert", () => {
  const rows = [
    { lap: 2, hr: 150, hrMax: 185, isWork: true, isFirstWork: true },
    { lap: 3, hr: 120, hrMax: 140, isWork: false, isFirstWork: false },
    { lap: 4, hr: 162, hrMax: 185, isWork: true, isFirstWork: false },
    { lap: 6, hr: 162, hrMax: 181, isWork: true, isFirstWork: false },
  ];
  const out = M.pulseTrendRows(rows, "int", { lo: 180, hi: 188 });
  assert.equal(out[0].plotHr, 180); assert.equal(out[0].status, "neutral"); // erste Arbeitsrunde
  assert.equal(out[1].plotHr, 120); assert.equal(out[1].status, "neutral"); // Pause: Ø, neutral
  assert.equal(out[2].plotHr, 180); assert.equal(out[2].status, "in");      // 185−5 im Band
  assert.equal(out[3].plotHr, 176); assert.equal(out[3].status, "out");     // 181−5 unterm Band
  out.forEach((r) => { if (r.status !== "neutral") { const inBand = r.plotHr >= 180 && r.plotHr <= 188; assert.equal(r.status === "in", inBand); } });
});
t("Intervalle ohne Peak-Daten (alte CSV): Rückfall auf Ø, konsistent", () => {
  const out = M.pulseTrendRows([{ lap: 2, hr: 185, hrMax: null, isWork: true, isFirstWork: false }], "int", { lo: 180, hi: 188 });
  assert.equal(out[0].plotHr, 185); assert.equal(out[0].status, "in"); assert.equal(out[0].isPeak, false);
});
t("Easy/Lang/Tempo: Ø für Wert UND Farbe — Peak fließt nirgends ein (v6.4-Widerspruch behoben)", () => {
  const rows = [
    { lap: 2, hr: 131, hrMax: 150, isWork: true, isFirstWork: true },
    { lap: 3, hr: 135, hrMax: 155, isWork: true, isFirstWork: false },
    { lap: 4, hr: 128, hrMax: 149, isWork: true, isFirstWork: false },
  ];
  const out = M.pulseTrendRows(rows, "easy", { lo: 130, hi: 138 });
  assert.equal(out[0].status, "neutral");
  assert.equal(out[1].plotHr, 135); assert.equal(out[1].status, "in");
  assert.equal(out[2].plotHr, 128); assert.equal(out[2].status, "out"); // Ø unterm Band → ehrlich "out"
  out.forEach((r) => assert.equal(r.isPeak, false));
});
t("Langer Lauf 04.07. (Screenshot-Fall R9): Ø 135 unter Band 140–155 → nicht mehr grün", () => {
  const out = M.pulseTrendRows([{ lap: 9, hr: 135, hrMax: 152, isWork: true, isFirstWork: false }], "long", { lo: 140, hi: 155 });
  assert.equal(out[0].plotHr, 135); assert.equal(out[0].status, "out"); // v6.4 sagte "in" (Peak 152−5=147)
});

console.log("v7.0 Bugfix C: Arbeitsabschnitt konsequent");
{
  const parseSimpleCsv = (text) => {
    const lines = text.trim().split(/\r?\n/);
    const cells = (line) => line.slice(1, -1).split('","');
    const header = cells(lines[0]);
    return lines.slice(1).map((line) => Object.fromEntries(header.map((h, i) => [h, cells(line)[i]])));
  };
  const csv = readFileSync(new URL("./fixtures/activity_23580207957_easy1307.csv", import.meta.url), "utf8");
  const laps = M.extractLaps(parseSimpleCsv(csv));
  t("Easy 13.07.: runEffort nutzt den Lauf-Abschnitt, 0,02-km-Splitter fliegt raus", () => {
    const eff = M.runEffort({ type: "easy", laps, dist: 4.27, sec: 1933, pace: 1933 / 4.27 });
    assert.equal(eff.basis, "Lauf-Abschnitt");
    assert.equal(eff.dist, 3.95); // R2+R3+R5+R6 — ohne den 0,02-km-Rest (R4)
    assert.ok(!eff.work.has(4), "Splitter-Runde darf nicht als Arbeit zählen");
  });
  t("synthetischer Easy-Lauf mit trägem Warm-up: Anker = Arbeits-Pace, nicht Gesamt", () => {
    const l = [2, 3, 4, 5].map((lap) => ({ lap, dist: 1, sec: 480, pace: 480, hr: 148, hrMax: 155 }));
    const eff = M.runEffort({ type: "long", laps: l, dist: 4.6, sec: 2270, pace: 493.5 });
    assert.equal(Math.round(eff.pace), 480); // nicht 493 (Gesamt) — genau der 04.07.-Screenshot-Fall
  });
}

console.log("v7.0: Abzeichen-Katalog & -Berechnung");
const doneForWeeks = (weeks) => {
  const done = {};
  weeks.forEach((w) => M.buildWeekPlan(w, undefined, undefined, [], "fixed").forEach((d) => d.items.forEach((it) => { if (it.load > 0) done[it.uid] = true; })));
  return done;
};
t("longestStreakInfo: längste je erreichte Serie bleibt, auch wenn die aktuelle gerissen ist", () => {
  const done = doneForWeeks([1, 2, 3, 5, 6]); // Woche 4 fehlt
  const info = M.longestStreakInfo(7, done, undefined, [], "fixed");
  assert.equal(info.best, 3);
  assert.equal(info.date, "2026-07-19"); // Sonntag der Woche 3 — Rekord-Zeitpunkt
  const live = M.computeStreak(7, done, undefined, [], "fixed");
  assert.ok(live < info.best, `live ${live} muss < Rekord ${info.best} sein`);
});
t("longestStreakInfo: komplett entschuldigte Krankheitswoche bricht die Serie nicht", () => {
  const done = doneForWeeks([1, 3]); // Woche 2 nicht trainiert …
  const ill = [{ id: "i1", start: "2026-07-06", end: "2026-07-12", note: "" }]; // … aber komplett krank
  assert.equal(M.longestStreakInfo(3, done, undefined, ill, "fixed").best, 3);
  assert.equal(M.longestStreakInfo(3, done, undefined, [], "fixed").best, 1); // ohne Krankmeldung: gerissen
});
t("planDoneDatesBySport: Plan-Daten aus der uid, sortiert", () => {
  const done = { "w1-Mi-vb": true, "w2-Mi-vb": true, "w1-Fr-vb": true };
  assert.deepEqual(M.planDoneDatesBySport("vb", done, undefined, [], "fixed"), ["2026-07-01", "2026-07-03", "2026-07-08"]);
});
t("cumulativeRunKmDate: Datum des Laufs, der die Schwelle reißt", () => {
  const runs = [{ date: "2026-07-05", dist: 10 }, { date: "2026-07-01", dist: 10 }, { date: "2026-07-10", dist: 6 }]; // unsortiert
  assert.equal(M.cumulativeRunKmDate(runs, 20), "2026-07-05");
  assert.equal(M.cumulativeRunKmDate(runs, 25), "2026-07-10");
  assert.equal(M.cumulativeRunKmDate(runs, 30), null);
});
t("Grenzfall 49,9 vs. 50,0 km", () => {
  const mk = (km) => ({ ...M.DEFAULT_DATA, runLog: [{ id: "a", date: "2026-07-01", type: "easy", dist: km, sec: 3000, pace: 300 }] });
  assert.equal(M.computeEarnedBadges(mk(49.9), 1, 0).find((b) => b.id === "run_50km").earned, false);
  assert.equal(M.computeEarnedBadges(mk(50.0), 1, 0).find((b) => b.id === "run_50km").earned, true);
});
t("Krafteinheiten = eindeutige Trainingstage, nicht Übungseinträge", () => {
  const log = [
    { id: "1", date: "2026-07-01", exercise: "Bank", weight: 40, reps: 8, sets: 3 },
    { id: "2", date: "2026-07-01", exercise: "Rudern", weight: 35, reps: 10, sets: 3 },
    { id: "3", date: "2026-07-03", exercise: "Bank", weight: 42, reps: 8, sets: 3 },
  ];
  const b = M.computeEarnedBadges({ ...M.DEFAULT_DATA, strengthLog: log }, 1, 0).find((x) => x.id === "strength_10");
  assert.equal(b.current, 2); // 2 Tage, nicht 3 Einträge
  assert.equal(b.earned, false);
});
t("rückwirkendes Datum: run_25km bekommt das historische Überschreitungs-Datum", () => {
  const data = { ...M.DEFAULT_DATA, runLog: [
    { id: "a", date: "2026-06-30", type: "easy", dist: 12, sec: 3600, pace: 300 },
    { id: "b", date: "2026-07-04", type: "long", dist: 14, sec: 4200, pace: 300 },
    { id: "c", date: "2026-07-10", type: "easy", dist: 5, sec: 1500, pace: 300 },
  ] };
  const b = M.computeEarnedBadges(data, 3, 0).find((x) => x.id === "run_25km");
  assert.equal(b.earned, true);
  assert.equal(b.earnedDate, "2026-07-04"); // nicht heute — der Lauf, der 25 km voll machte
});
t("leerer Account: kein einziges Abzeichen, keine Fehler", () => {
  const all = M.computeEarnedBadges({ ...M.DEFAULT_DATA }, 1, 0);
  assert.ok(all.every((b) => !b.earned));
});
t("Live-Serie: hängt am durchgereichten Streak-Wert, ohne Datum", () => {
  const all = M.computeEarnedBadges({ ...M.DEFAULT_DATA }, 1, 8);
  assert.equal(all.find((b) => b.id === "live_streak_4").earned, true);
  assert.equal(all.find((b) => b.id === "live_streak_8").earned, true);
  assert.equal(all.find((b) => b.id === "live_streak_12").earned, false);
  assert.equal(all.find((b) => b.id === "live_streak_8").earnedDate, null);
});
t("Katalog: ids eindeutig, Gruppen bekannt", () => {
  assert.equal(new Set(M.BADGE_CATALOG.map((b) => b.id)).size, M.BADGE_CATALOG.length);
  assert.ok(M.BADGE_CATALOG.every((b) => M.BADGE_GROUPS[b.group]));
});

console.log("v7.0: Gesamtstatistik");
t("lifetimeStats: Summen, Rekorde, beste Woche", () => {
  const runs = [
    { id: "a", date: "2026-06-30", type: "easy", dist: 4.0, sec: 1920, pace: 480 },
    { id: "b", date: "2026-07-04", type: "long", dist: 8.31, sec: 3478, pace: 418.5 },
    { id: "c", date: "2026-07-16", type: "easy", dist: 5.01, sec: 2469, pace: 492.8 },
  ];
  const s = M.lifetimeStats(runs, { "w1-Mo-run": true, "w1-Mi-vb": true, x: false });
  assert.equal(s.totalKm, 17.3);
  assert.equal(s.doneCount, 2); // false zählt nicht
  assert.equal(s.runCount, 3);
  assert.equal(s.longest.dist, 8.31);
  // beide ≥5-km-Läufe kommen infrage — der lange Lauf ist anteilig schneller (2093 s < 2464 s)
  assert.equal(s.best5k.sec, Math.round(3478 * 5 / 8.31));
  assert.equal(s.best5k.r.id, "b");
  assert.equal(s.best10k, null); // noch kein ≥10-km-Lauf → ehrlich leer
  // 30.06. (Di) und 04.07. (Sa) liegen in derselben Trainingswoche ab Mo 29.06.
  assert.equal(s.bestWeek.km, 12.3); // auf 1 Nachkommastelle gerundet
  assert.equal(s.bestWeek.monday, "2026-06-29");
  // v7.2: ohne Runden-Import fällt runEffort() je Lauf auf dessen Gesamtwerte zurück — Arbeitssumme = Gesamtsumme
  assert.equal(s.totalWorkKm, 17.3);
  assert.equal(s.totalWorkSec, 1920 + 3478 + 2469);
});
t("fmtHours: Dezimalstunden, 1 Nachkommastelle (Nutzer-Wunsch statt h:mm)", () => {
  assert.equal(M.fmtHours(0), 0);
  assert.equal(M.fmtHours(1740), 0.5); // 29 Min
  assert.equal(M.fmtHours(3600), 1);
  assert.equal(M.fmtHours(5400), 1.5);
  assert.equal(M.fmtHours(15000), 4.2); // 4:10 h ≈ 4.17 h → 1 Nachkommastelle
});
t("monthlyRunKm: lückenlos, Monatssummen, Jahreslabel nur bei Jahresmix", () => {
  const runs = [
    { date: "2026-05-30", dist: 3 },
    { date: "2026-07-04", dist: 8.31 },
    { date: "2026-07-16", dist: 5.01 },
  ];
  const m = M.monthlyRunKm(runs, "2026-07-17");
  assert.deepEqual(m.map((x) => x.key), ["2026-05", "2026-06", "2026-07"]);
  assert.deepEqual(m.map((x) => x.km), [3, 0, 13.3]); // Juni als 0 dabei, nicht weggelassen
  assert.ok(m.every((x) => !/\d/.test(x.label))); // ein Jahr → keine Jahreszahl im Label
  const multi = M.monthlyRunKm([{ date: "2025-12-30", dist: 3 }, { date: "2026-01-04", dist: 4 }], "2026-01-31");
  assert.deepEqual(multi.map((x) => x.label), ["Dez 25", "Jan 26"]);
});

console.log("v7.0: Datenmodell & Regression");
t("DEFAULT_DATA enthält hiddenBadgeIds/seenBadgeIds (Backfill über Spread beim Laden)", () => {
  assert.deepEqual(M.DEFAULT_DATA.hiddenBadgeIds, []);
  assert.deepEqual(M.DEFAULT_DATA.seenBadgeIds, []);
});
t("buildWeekPlan ohne Krankheit bleibt byte-identisch zu vorher (kein Ramp-Einfluss)", () => {
  const plan = M.buildWeekPlan(2, undefined, undefined, [], "fixed");
  const di = plan.find((d) => d.day === "Di").items.find((i) => i.sport === "run");
  assert.equal(di.type, "int"); assert.equal(di.load, 7); assert.equal(di.hr, "180–188");
});

console.log(`\nAlle ${n} Tests grün.`);
