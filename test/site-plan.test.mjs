/**
 * Tests for the plan's decisions.
 *
 * Plain node over the pure module: no browser, no DOM, no network. This is
 * what src/lib/sitePlan.js was extracted for, and it is the first test runner
 * this project has had.
 *
 * The cases below are the rules a buyer could dispute: which lots a filter
 * leaves visible, where the arrow keys go and where they stop, which lot holds
 * the tab stop, and what a shortlisted lot costs per month.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { LOTS, LOT_BY_ID } from "../src/lib/lots.js";
import { sampleComputation } from "../src/lib/finance.js";
import {
  NO_FILTERS,
  PLAN_ARROW_KEYS,
  PLAN_TERMS,
  filterIsActive,
  focusTabIndex,
  nextFocus,
  planComparison,
  statusCounts,
  toggleStatusFilter,
  visibleLots,
} from "../src/lib/sitePlan.js";

const EVERY_LOT = visibleLots(LOTS, NO_FILTERS);
const STATUSES = ["available", "preselling", "reserved", "sold"];

test("the inventory is 68 lots across six phases, all four statuses in play", () => {
  assert.equal(LOTS.length, 68);
  assert.deepEqual(
    [...new Set(LOTS.map((l) => l.phase))].sort(),
    [1, 2, 3, 4, 5, 6]
  );
  const counts = statusCounts(LOTS);
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b, 0),
    68
  );
  for (const status of STATUSES) {
    assert.ok(counts[status] > 0, `${status} should appear in the inventory`);
  }
});

test("an unfiltered plan shows every lot, and counts as unfiltered", () => {
  assert.equal(EVERY_LOT.length, 68);
  assert.equal(filterIsActive(NO_FILTERS), false);
});

test("the inventory totals do not move when the plan is filtered", () => {
  // The totals are stock figures. A count that changed with the filter would
  // be lying about what is left, so statusCounts never sees the filter.
  const counts = statusCounts(LOTS);
  const shown = visibleLots(LOTS, { statuses: ["available"], phase: "all", minArea: "any" });
  assert.equal(shown.length, counts.available);
  assert.ok(shown.every((l) => l.status === "available"));
  assert.equal(filterIsActive({ statuses: ["available"], phase: "all", minArea: "any" }), true);
});

test("phase and size filters compose, and can leave nothing", () => {
  const phase5 = visibleLots(LOTS, { statuses: null, phase: 5, minArea: "any" });
  assert.equal(phase5.length, 10);
  assert.ok(phase5.every((l) => l.phase === 5));

  // The threshold comes from the data, so this case cannot go stale if the
  // size ladder ever changes.
  const sizes = [...new Set(LOTS.map((l) => l.area))].sort((a, b) => a - b);
  const threshold = sizes[sizes.length - 2];
  const big = visibleLots(LOTS, { statuses: null, phase: "all", minArea: threshold });
  assert.ok(big.length > 0);
  assert.ok(big.length < LOTS.length); // and it has to actually narrow
  assert.ok(big.every((l) => l.area >= threshold));

  // An empty status list matches nothing, which is exactly why the chip rule
  // below is written to return All instead of ever producing one.
  assert.equal(visibleLots(LOTS, { statuses: [], phase: "all", minArea: "any" }).length, 0);
});

test("a chip solos out of All, and the last removal goes back to All", () => {
  assert.deepEqual(toggleStatusFilter(null, "available"), ["available"]);
  assert.deepEqual(toggleStatusFilter(["available"], "preselling"), [
    "available",
    "preselling",
  ]);
  assert.deepEqual(toggleStatusFilter(["available", "preselling"], "available"), [
    "preselling",
  ]);
  assert.equal(toggleStatusFilter(["available"], "available"), null);
});

test("selecting every status by hand lands back on All, never on an empty list", () => {
  let state = null;
  for (const status of STATUSES) state = toggleStatusFilter(state, status);
  assert.equal(state, null);
});

test("arrow down follows the column, including in the two 5-wide phases", () => {
  // The stride-of-four bug this geometry replaced: 5-01 is row 0 column 0 and
  // 5-06 is directly below it, four columns to the left of 5-05.
  assert.equal(nextFocus(LOTS, EVERY_LOT, "5-01", "ArrowDown")?.id, "5-06");
  assert.equal(nextFocus(LOTS, EVERY_LOT, "5-02", "ArrowDown")?.id, "5-07");
  assert.equal(nextFocus(LOTS, EVERY_LOT, "1-01", "ArrowDown")?.id, "1-05");
  assert.equal(nextFocus(LOTS, EVERY_LOT, "1-01", "ArrowRight")?.id, "1-02");
  assert.equal(nextFocus(LOTS, EVERY_LOT, "2-01", "ArrowRight")?.id, "2-02");
});

test("an arrow at the edge of the plan has nowhere to go", () => {
  assert.equal(nextFocus(LOTS, EVERY_LOT, "1-01", "ArrowLeft"), null);
  assert.equal(nextFocus(LOTS, EVERY_LOT, "1-01", "ArrowUp"), null);
});

test("only the four arrow keys move the plan", () => {
  assert.deepEqual([...PLAN_ARROW_KEYS].sort(), [
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
  ]);
  assert.equal(nextFocus(LOTS, EVERY_LOT, "1-01", "Enter"), null);
  assert.equal(nextFocus(LOTS, EVERY_LOT, "not-a-lot", "ArrowDown"), null);
});

test("moving never lands on the current lot, and never leaves the visible set", () => {
  for (const lot of LOTS) {
    for (const key of PLAN_ARROW_KEYS) {
      const next = nextFocus(LOTS, EVERY_LOT, lot.id, key);
      if (!next) continue;
      assert.notEqual(next.id, lot.id);
      assert.ok(EVERY_LOT.some((l) => l.id === next.id), `${next.id} should be visible`);
    }
  }
});

test("a filtered plan never moves focus onto a hidden lot", () => {
  const onlyAvailable = visibleLots(LOTS, { statuses: ["available"], phase: "all", minArea: "any" });
  assert.ok(onlyAvailable.length > 0);
  for (const lot of onlyAvailable) {
    for (const key of PLAN_ARROW_KEYS) {
      const next = nextFocus(LOTS, onlyAvailable, lot.id, key);
      if (next) assert.equal(next.status, "available");
    }
  }
});

test("the tab stop follows the focused lot while a filter leaves it on screen", () => {
  assert.equal(focusTabIndex(LOTS, EVERY_LOT, 0), 0);

  const phase5 = visibleLots(LOTS, { statuses: null, phase: 5, minArea: "any" });
  const kept = LOTS.findIndex((l) => l.id === phase5[3].id);
  assert.equal(focusTabIndex(LOTS, phase5, kept), kept);
});

test("the tab stop falls back to the first matching lot, and leaves the tab order when nothing matches", () => {
  const phase5 = visibleLots(LOTS, { statuses: null, phase: 5, minArea: "any" });
  // Focus sits on lot 1-01, which a phase 5 filter hides.
  const fallback = focusTabIndex(LOTS, phase5, 0);
  assert.equal(LOTS[fallback].id, phase5[0].id);
  assert.equal(LOTS[fallback].phase, 5);

  assert.equal(focusTabIndex(LOTS, [], 0), -1);
});

test("the comparison prices every shortlisted lot on the plan's opening terms", () => {
  const a = LOT_BY_ID["1-01"];
  const b = LOT_BY_ID["2-05"];
  const { rows, lowestMonthly } = planComparison([a, b]);

  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.lot.id),
    [a.id, b.id]
  );
  assert.equal(rows[0].perSqm, a.price / a.area);
  // The comparison and the calculator must agree, or a lot compared here and
  // computed there would come out at two different prices.
  assert.equal(rows[0].monthly, sampleComputation({ price: a.price, ...PLAN_TERMS }).amortisation);
  assert.equal(lowestMonthly, Math.min(rows[0].monthly, rows[1].monthly));
});

test("a shortlist of one is never called the lowest monthly", () => {
  assert.equal(planComparison([LOT_BY_ID["1-01"]]).lowestMonthly, null);
  assert.equal(planComparison([]).rows.length, 0);
  assert.equal(planComparison([]).lowestMonthly, null);
});
