/* ============================================================
   The plan's decisions.

   Lifted out of SitePlan.jsx on Oct 7, 2026, for the same reason lots.js was
   lifted out of the drawing the day before: the plan's rules had grown into
   the component that draws it. There are five of them, and each one is a rule
   a buyer could dispute:

     which lots a filter leaves visible
     what the status chips do to each other
     where the arrow keys go, and where they stop
     which lot the plan leaves in the tab order
     what a shortlisted lot costs per month

   All five are pure. Lots in, decisions out: no React, no DOM, no history
   API, no clipboard, nothing that needs a browser. That is the whole point -
   test/site-plan.test.mjs checks them with plain node, which is how this
   project gets its first test runner.

   Every figure stays illustrative, like the rest of the content model.
   ============================================================ */

import { PAYMENT_TERMS, SCHEMES } from "../data/village.js";
import { sampleComputation } from "./finance.js";
import { STATUS_ORDER } from "./lots.js";

/* Lot only, on the terms the financing panel opens with, so a lot compared
   here and a lot computed there are priced the same way. */
export const PLAN_TERMS = {
  dpPct: PAYMENT_TERMS.defaultDpPct,
  dpMonths: PAYMENT_TERMS.defaultDpMonths,
  schemeId: SCHEMES.pagibig.id,
  years: SCHEMES.pagibig.defaultYears,
};

/** A fresh plan shows everything: no status narrowed, every phase, any size. */
export const NO_FILTERS = { statuses: null, phase: "all", minArea: "any" };

/**
 * Inventory totals per status.
 *
 * Deliberately unfiltered: these are the stock figures, and a total that
 * moved every time you filtered would be lying about what is left.
 */
export function statusCounts(lots) {
  return lots.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});
}

/** The lots a filter leaves on the plan. */
export function visibleLots(lots, { statuses, phase, minArea }) {
  return lots.filter(
    (l) =>
      (!statuses || statuses.includes(l.status)) &&
      (phase === "all" || l.phase === phase) &&
      (minArea === "any" || l.area >= minArea)
  );
}

/**
 * Whether the plan is filtered at all.
 *
 * The result line and the Reset button both follow this one answer, so both
 * agree about what counts as a filter, including the status chip state where
 * every status is selected and the plan is therefore unfiltered.
 */
export function filterIsActive({ statuses, phase, minArea }) {
  return statuses !== null || phase !== "all" || minArea !== "any";
}

/**
 * The next status chip state after one chip is pressed.
 *
 * A chip pressed out of the All state solos it. Pressing it again clears the
 * filter entirely rather than leaving nothing visible, and selecting every
 * status by hand lands back on All, because "all four selected" and "nothing
 * selected" are the same view and should not be two states the plan has to
 * tell apart. Returns null for All.
 */
export function toggleStatusFilter(current, status) {
  if (!current) return [status]; // solo it out of the All state
  if (current.includes(status)) {
    const next = current.filter((s) => s !== status);
    return next.length ? next : null;
  }
  const next = [...current, status];
  return next.length === STATUS_ORDER.length ? null : next;
}

const STEPS = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

/**
 * The keys the plan moves on.
 *
 * The component stops the arrow keys from scrolling the page on exactly these,
 * including when the arrow has nowhere to go, so the set has one home rather
 * than being spelled out again at the call site.
 */
export const PLAN_ARROW_KEYS = Object.keys(STEPS);

/* Nearest lot in the direction of the arrow, measured on the drawn plan.

   This replaces a fixed index stride of four, which was wrong for the two
   5-wide phases: Arrow Down from Lot 5-01 landed on 5-05, four columns to
   the right, instead of 5-06 directly below it. It also wrapped around row
   ends, so Arrow Left from the first lot of a row jumped up and to the
   right. Geometry gets every block shape right, including the two that are
   centred on their column, and it stops at the edge of the plan instead of
   jumping somewhere else. */
function nearestInDirection(from, candidates, dx, dy) {
  let best = null;
  let bestScore = Infinity;
  for (const lot of candidates) {
    if (lot.id === from.id) continue;
    const ax = lot.cx - from.cx;
    const ay = lot.cy - from.cy;
    const forward = ax * dx + ay * dy;
    if (forward <= 1) continue; // behind, or level with, the current lot
    const sideways = Math.abs(ax * dy) + Math.abs(ay * dx);
    const score = forward + sideways * 2.5; // prefer straight ahead
    if (score < bestScore) {
      bestScore = score;
      best = lot;
    }
  }
  return best;
}

/**
 * Where an arrow key moves the plan's focus, or null when the arrow has
 * nowhere to go. Only lots the filter left visible are candidates, so a
 * filtered plan never moves focus onto a lot that is dimmed out.
 */
export function nextFocus(lots, candidates, fromId, key) {
  const step = STEPS[key];
  if (!step) return null;
  const from = lots.find((l) => l.id === fromId);
  if (!from) return null;
  return nearestInDirection(from, candidates, step[0], step[1]);
}

/**
 * The one tab stop the whole plan gets.
 *
 * It follows the focused lot while that lot is still on screen, falls back to
 * the first matching lot when a filter has hidden it, and with nothing
 * matching returns -1 so the plan leaves the tab order entirely rather than
 * offering a stop that does nothing.
 */
export function focusTabIndex(lots, matching, focusIdx) {
  const focused = lots[focusIdx];
  if (focused && matching.some((l) => l.id === focused.id)) return focusIdx;
  if (!matching.length) return -1;
  return lots.findIndex((l) => l.id === matching[0].id);
}

/**
 * The shortlist comparison.
 *
 * Rows in shortlist order, each with the monthly amortisation on PLAN_TERMS
 * and the price per square metre. `lowestMonthly` is the value the cards
 * single out, and it stays null for a shortlist of one, because "lowest" is
 * not a claim you can make about a single lot.
 */
export function planComparison(shortlistLots, terms = PLAN_TERMS) {
  const rows = shortlistLots.map((lot) => {
    const calc = sampleComputation({ price: lot.price, ...terms });
    return { lot, monthly: calc.amortisation, perSqm: lot.price / lot.area };
  });
  const lowestMonthly = rows.length > 1 ? Math.min(...rows.map((r) => r.monthly)) : null;
  return { rows, lowestMonthly };
}
