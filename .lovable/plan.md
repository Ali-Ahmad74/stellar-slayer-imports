# Add Position & Phase Analysis to Player Records

Add two new analytical cards inside the **Records** tab on the Player Profile page (`/player/:id`).

## 1. Batting Position & Winning Contribution Chart

A grouped bar chart showing, for each batting position the player has played at:
- **Total runs** scored at that position
- **Runs in winning matches** (matches where `result = 'won'`)
- **Innings count** at that position (shown as label)

Layout: position on X-axis (1, 2, 3, 4, …), runs on Y-axis, two bars per position (Total / Winning Cause). Below the chart, small KPI tiles:
- Best position (most runs)
- Best winning-cause position
- Average position

**Data source:** `batting_inputs.batting_position` joined with `matches.result`. Both fields already exist — no DB changes needed. Innings without `batting_position` set are bucketed under "Unknown".

## 2. Early Innings Strike Rate Chart

A bar chart comparing the player's strike rate during different ball windows of an innings. Since the database stores per-innings totals (not ball-by-ball), we approximate using innings-level buckets:

- **Powerplay starter (1–10 balls)** — average SR across innings where the player faced ≤10 balls
- **Settling (11–30 balls)** — average SR across innings where the player faced 11–30 balls
- **Established (31+ balls)** — average SR across innings where the player faced 31+ balls

Each bucket shows: average SR, innings count, total runs in that bucket. This honestly reflects how the player scores in short cameos vs longer stays at the crease — which is the closest proxy possible without ball-by-ball data.

A small note in the card explains: *"Based on innings duration buckets (ball-by-ball data not tracked)."*

## Technical Details

**New files:**
- `src/components/player/PlayerPositionChart.tsx` — position vs runs / winning-runs grouped bar chart (Recharts)
- `src/components/player/PlayerPhaseStrikeRate.tsx` — innings-bucket SR bar chart (Recharts)
- `src/hooks/usePlayerPositionAnalysis.ts` — fetches `batting_inputs` (with `batting_position`) joined to `matches` (for `result`) for the player, filtered by `selectedSeasonId`. Returns aggregated arrays for both charts.

**Modified files:**
- `src/components/player/PlayerRecordsTab.tsx` — add the two new cards into the existing 2-column grid (full width for position chart, half width for phase SR alongside Form Analysis, OR both full-width — final layout decided during build).
- `src/pages/PlayerProfile.tsx` — pass `selectedSeasonId` down to `PlayerRecordsTab` so the new hook can respect the season filter.

**Aggregation logic (hook):**
```text
- Fetch batting_inputs (player_id, season filter) with embedded matches(result)
- For position chart: group by batting_position → sum runs, sum runs where result='won', count innings
- For phase chart: bucket each innings by balls faced (≤10 / 11–30 / 31+)
   → for each bucket: total_runs, total_balls, innings_count, SR = runs/balls*100
```

**Styling:** matches existing Records tab cards — `Card variant="elevated"`, Orbitron font for titles, primary/accent colors from theme, glassmorphism consistent with the rest of the profile.

## Out of Scope
- True ball-by-ball SR (requires new schema + admin entry UI). Can be a follow-up if desired.
- PDF/PNG export inclusion of these new charts (can be added after visual confirmation).