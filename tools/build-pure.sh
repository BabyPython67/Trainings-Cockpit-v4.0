#!/bin/bash
# Baut die Pure-Function-Testfassung: Quelldatei + Export-Anhang -> ESM-Bundle mit Stub-Shims.
# Quelldatei wird automatisch erkannt (Trainings-Cockpit-v*-Quellcode.txt im Repo-Root) — bei einem
# Versionssprung muss dieses Script NICHT angepasst werden.
set -e
TOOLS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$TOOLS_DIR/.." && pwd)"
BUILD_DIR="$TOOLS_DIR/.build"
mkdir -p "$BUILD_DIR"
SRC=$(ls "$REPO_DIR"/Trainings-Cockpit-v*-Quellcode.txt 2>/dev/null | head -1)
if [ -z "$SRC" ]; then echo "Keine Quelldatei im Repo-Root gefunden" >&2; exit 1; fi
cp "$SRC" "$BUILD_DIR/app-test.jsx"
cat >> "$BUILD_DIR/app-test.jsx" <<'EOF'

/* Test-Anhang: pure Funktionen exportieren */
export {
  buildWeekPlan, plannedWeekLoad, weekLoadBySport, weekFulfilled, computeStreak, migrateDone,
  parseHrTarget, planRunTargets, hrTargetForType, rawPlanWeekOf, monthGrid, weekGrid, toLocalISO,
  targetPaceSec, getRunWeek, effectiveWeek, planTotalWeeks, chipSide, secToMMSS,
  classifyLaps, aggregateLaps, runEffort, schoolStatus, groupByFach,
  DEFAULT_DATA, DAYS, PLAN_START, TOTAL_WEEKS, PACE_BAND_SEC,
  applyTimeRange, decouplingPct, efMetersPerBeat, TIME_RANGES, runPlanProgress,
  extractLaps, extractExtras, pickCol, hrPeakStatus, HR_PEAK_MARGIN_BPM, STOP_RATIO_THRESHOLD,
  longestStreakInfo, planDoneDatesBySport, cumulativeRunKmDate, BADGE_CATALOG, BADGE_GROUPS,
  computeEarnedBadges, lifetimeStats, monthlyRunKm, pulseTrendRows, fmtHours, STRENGTH,
  badgeMedalTier, MEDAL_TIERS, hexPath, isMovable,
};
EOF
npx esbuild "$BUILD_DIR/app-test.jsx" --bundle --format=esm --outfile="$BUILD_DIR/pure.mjs" \
  --loader:.jsx=jsx --jsx=transform \
  --alias:react="$TOOLS_DIR/shims/react.cjs" \
  --alias:recharts="$TOOLS_DIR/shims/proxy.cjs" \
  --alias:papaparse="$TOOLS_DIR/shims/proxy.cjs" \
  --alias:lucide-react="$TOOLS_DIR/shims/proxy.cjs" \
  --log-level=warning
echo "pure.mjs gebaut: $BUILD_DIR/pure.mjs"
