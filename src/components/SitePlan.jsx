import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOT_PRICING, SCHEMES, peso } from "../data/village";
import {
  BLOCK_W,
  BLOCK_W_WIDE,
  COL_A,
  COL_C_WIDE,
  LAYOUT,
  LOTS,
  LOT_INDEX,
  LOT_SIZES,
  LOT_H,
  LOT_W,
  STATUS_LABEL,
  STATUS_ORDER,
  lotName,
  lotSummary,
} from "../lib/lots";
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
} from "../lib/sitePlan";
import { SHORTLIST_MAX, useVillage } from "../lib/useVillage";
import {
  IconArrow,
  IconCheck,
  IconClose,
  IconLink,
  IconLock,
  IconPlus,
  IconRuler,
  IconScale,
} from "./Icons";

/* ============================================================
   The site plan.

   This is the piece the reference didn't have. A cinematic scroll looks
   good; a buyer actually wants to see the inventory. Lots are laid out as
   an SVG so they stay crisp at any size, print correctly, and can be
   reached by keyboard.

   Rewritten on Oct 6, 2026 around the buyer's task rather than around
   browsing: the legend became the filter, the lots carry their numbers,
   up to three lots can be set aside and compared, the open lot is a
   shareable URL, and the same lot flows into the calculator and the form.
   ============================================================ */

export default function SitePlan() {
  const { selectedLotId, selectedLot, selectLot, clearSelection, shortlist, shortlistLots, toggleShortlist, clearShortlist, computeFor } =
    useVillage();

  const [focusIdx, setFocusIdx] = useState(0);
  /* One object for the three questions the plan can ask of its inventory, so
     the filter shape sitePlan.js expects is built in exactly one place, and
     the state a fresh plan opens in is sitePlan.NO_FILTERS. */
  const [filters, setFilters] = useState(NO_FILTERS);
  const [copied, setCopied] = useState(false);
  const refs = useRef([]);

  /* Unfiltered, and deliberately so: these are the inventory totals, and a
     total that moved every time you filtered would be lying about stock. The
     rule itself lives in sitePlan.statusCounts. */
  const counts = useMemo(() => statusCounts(LOTS), []);

  const matching = useMemo(() => visibleLots(LOTS, filters), [filters]);

  const matchingIds = useMemo(() => new Set(matching.map((l) => l.id)), [matching]);
  const filterActive = filterIsActive(filters);

  /* One tab stop for the whole plan. Which lot holds it, and what happens
     when a filter hides that lot, is sitePlan.focusTabIndex. */
  const tabIdx = focusTabIndex(LOTS, matching, focusIdx);

  /* The status chips are one control, not four: what a press does to the
     current selection is sitePlan.toggleStatusFilter. */
  const toggleStatus = (status) =>
    setFilters((prev) => ({ ...prev, statuses: toggleStatusFilter(prev.statuses, status) }));

  const clearStatus = () => setFilters((prev) => ({ ...prev, statuses: null }));
  const setPhase = (phase) => setFilters((prev) => ({ ...prev, phase }));
  const setSize = (minArea) => setFilters((prev) => ({ ...prev, minArea }));
  const resetFilters = () => setFilters(NO_FILTERS);

  const onKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectLot(LOTS[index].id);
      return;
    }
    if (!PLAN_ARROW_KEYS.includes(e.key)) return;
    e.preventDefault();
    const next = nextFocus(LOTS, matching, LOTS[index].id, e.key);
    if (!next) return;
    const nextIdx = LOT_INDEX[next.id];
    setFocusIdx(nextIdx);
    refs.current[nextIdx]?.focus();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard refused. The URL is already in the address bar.
      setCopied(false);
    }
  };

  const inShortlist = selectedLot ? shortlist.includes(selectedLot.id) : false;
  const shortlistFull = shortlist.length >= SHORTLIST_MAX;

  /* The comparison. Lot only, on the terms the calculator opens with, so a
     lot here and a lot there are priced the same way. The arithmetic and the
     lowest-monthly rule are sitePlan.planComparison. */
  const { rows: compareRows, lowestMonthly } = useMemo(
    () => planComparison(shortlistLots),
    [shortlistLots]
  );

  return (
    <section className="section" id="plan">
      <div className="section-head reveal">
        <p className="eyebrow">The plan</p>
        <h2 className="h2">
          Every lot, <em>on one plan.</em>
        </h2>
        <p className="lede">
          Six phases around a central avenue and the village plaza. Pick a lot to see its area,
          whether it is still open, and what it would cost: lot only, with construction optional.
        </p>
      </div>

      <div className="plan-shell reveal reveal-d1">
        <div className="plan-stage">
          {/* On a phone the whole plan would shrink the lots to about 20px,
              too small to hit. Below 980px it keeps a minimum width and
              scrolls sideways instead. */}
          <div className="plan-scroll">
            <svg
              className="plan-svg"
              viewBox="0 0 980 620"
              role="group"
              aria-label="Site plan of St. Joseph Village. Use the arrow keys to move between lots and Enter to select one."
            >
              {/* Avenue + the lanes between the rows of blocks */}
              <rect className="road" x="316" y="40" width="26" height="460" rx="5" />
              {LAYOUT.filter((l) => l.phase < 5).map(({ phase, x }) => (
                <rect key={`lane-${phase}`} className="road" x={x} y="262" width={BLOCK_W} height="22" rx="5" />
              ))}
              <rect className="road" x={COL_C_WIDE} y="234" width={BLOCK_W_WIDE} height="22" rx="5" />

              {/* Open space */}
              <rect className="greens" x={COL_A} y="540" width={BLOCK_W} height="54" rx="12" />
              <ellipse className="greens" cx="800" cy="566" rx="78" ry="34" />
              <text className="plan-label" x={COL_A + 16} y="572">Pocket park · jogging loop</text>
              <text className="plan-label" x="758" y="570">Retention pond</text>

              {/* Plaza + chapel at the head of the avenue */}
              <circle className="greens" cx="329" cy="470" r="42" />
              <rect className="chapel-mark" x="319" y="444" width="20" height="26" rx="3" />
              <path d="M329 432v8M325 436h8" stroke="var(--clay)" strokeWidth="2" fill="none" />
              <text className="plan-label" x="329" y="544" textAnchor="middle">St. Joseph Chapel</text>

              {/* Phase labels */}
              {LAYOUT.map(({ phase, x, y }) => (
                <text className="plan-label" key={`label-${phase}`} x={x} y={y - 14}>
                  Phase {phase}
                </text>
              ))}
              <text className="plan-label" x="329" y="30" textAnchor="middle">Main avenue</text>

              {/* Lots. The number is drawn inside each lot: 68 unlabelled
                  rectangles read as a checkerboard, and the only way to
                  identify one was to hover or tab through it. */}
              {LOTS.map((lot, i) => (
                <g
                  key={lot.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  className={`lot lot--${lot.status} ${matchingIds.has(lot.id) ? "" : "is-dim"} ${
                    selectedLotId === lot.id ? "is-active" : ""
                  }`}
                  role="button"
                  tabIndex={i === tabIdx ? 0 : -1}
                  aria-label={`Lot ${lot.id}, phase ${lot.phase}, ${lot.area} square metres, ${STATUS_LABEL[lot.status]}${lot.corner ? ", corner lot" : ""}`}
                  onClick={() => selectLot(lot.id)}
                  onFocus={() => setFocusIdx(i)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                >
                  <rect x={lot.x} y={lot.y} width={LOT_W} height={LOT_H} rx="5" />
                  <text
                    className="plan-num"
                    x={lot.cx}
                    y={lot.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {lot.id}
                  </text>
                  <title>{`${lotName(lot)} - ${lot.area} sqm - ${STATUS_LABEL[lot.status]}`}</title>
                </g>
              ))}
            </svg>
          </div>
          <p className="plan-scroll-hint">Drag the plan sideways to explore all six phases.</p>

          {/* The legend became the filter. It already explained the four lot
              colours, so making it do the work removes a row of swatches and
              answers the only question the plan raises: what is still open. */}
          <div className="plan-filters" role="group" aria-label="Filter the plan">
            <div className="plan-chips">
              <button
                className="plan-chip plan-chip--all"
                aria-pressed={!filters.statuses}
                onClick={clearStatus}
              >
                All lots
              </button>
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  className="plan-chip"
                  aria-pressed={Boolean(filters.statuses?.includes(s))}
                  onClick={() => toggleStatus(s)}
                >
                  <span className={`swatch swatch--${s}`} aria-hidden="true" />
                  {STATUS_LABEL[s]}
                  <b>{counts[s] || 0}</b>
                </button>
              ))}
            </div>

            <div className="plan-selects">
              <label className="sr-only" htmlFor="plan-phase">
                Phase
              </label>
              <select
                id="plan-phase"
                className="select select--compact"
                value={filters.phase}
                onChange={(e) => setPhase(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">All phases</option>
                {LAYOUT.map(({ phase }) => (
                  <option key={phase} value={phase}>
                    Phase {phase}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="plan-size">
                Lot size
              </label>
              <select
                id="plan-size"
                className="select select--compact"
                value={filters.minArea}
                onChange={(e) => setSize(e.target.value === "any" ? "any" : Number(e.target.value))}
              >
                <option value="any">Any size</option>
                {LOT_SIZES.slice(1).map((s) => (
                  <option key={s} value={s}>
                    {s} sqm and up
                  </option>
                ))}
              </select>

              {filterActive && (
                <button className="plan-reset" onClick={resetFilters}>
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Only speaks when it has something to say. */}
          {filterActive && (
            <p className="plan-result" aria-live="polite">
              {matching.length === 0
                ? "No lot matches those filters."
                : `Showing ${matching.length} of ${LOTS.length} lots.`}
            </p>
          )}
        </div>

        <div className="plan-panel">
          <div aria-live="polite">
            {!selectedLot ? (
              <div className="plan-empty">
                <IconRuler size={20} />
                <p style={{ marginTop: 8 }}>
                  Select a lot on the plan to see its area, status and indicative price.
                </p>
              </div>
            ) : (
              <article className="plan-card">
                <div className="plan-card-top">
                  <div>
                    <h3>{lotName(selectedLot)}</h3>
                    <p className="plan-sub">
                      Phase {selectedLot.phase} · {STATUS_LABEL[selectedLot.status]}
                    </p>
                  </div>
                  <div className="plan-card-tools">
                    <button
                      className="icon-btn"
                      onClick={copyLink}
                      aria-label={`Copy a link to ${lotName(selectedLot)}`}
                      title="Copy a link to this lot"
                    >
                      {copied ? <IconCheck size={15} /> : <IconLink size={15} />}
                    </button>
                    <button
                      className="icon-btn"
                      onClick={clearSelection}
                      aria-label="Close the lot detail"
                      title="Close"
                    >
                      <IconClose size={15} />
                    </button>
                  </div>
                </div>
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? "Link to this lot copied." : ""}
                </span>

                <div className="plan-price">
                  {peso(selectedLot.price)}
                  <small>lot only · house construction optional</small>
                </div>

                <dl className="spec-table">
                  <div className="spec-row">
                    <dt>Lot area</dt>
                    <dd>{selectedLot.area} sqm</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Classification</dt>
                    <dd>{selectedLot.corner ? "Corner lot" : "Inner lot"}</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Rate</dt>
                    <dd>
                      {peso(LOT_PRICING.perSqm)} / sqm
                      {selectedLot.corner ? ` + ${LOT_PRICING.cornerPremiumPct}%` : ""}
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Status</dt>
                    <dd>{STATUS_LABEL[selectedLot.status]}</dd>
                  </div>
                </dl>

                <div className="plan-actions">
                  <a className="btn btn-gold" href="#tripping">
                    Book a tripping for {lotName(selectedLot)} <IconArrow size={15} />
                  </a>
                  <a
                    className="btn btn-ghost"
                    href="#financing"
                    onClick={() => computeFor(`lot:${selectedLot.id}`)}
                  >
                    Compute this lot <IconScale size={15} />
                  </a>
                  <button
                    className="plan-short"
                    aria-pressed={inShortlist}
                    disabled={!inShortlist && shortlistFull}
                    title={
                      !inShortlist && shortlistFull
                        ? `The shortlist holds ${SHORTLIST_MAX} lots. Remove one to add another.`
                        : undefined
                    }
                    onClick={() => toggleShortlist(selectedLot.id)}
                  >
                    {inShortlist ? <IconCheck size={14} /> : <IconPlus size={14} />}
                    {inShortlist ? "In your shortlist" : "Add to shortlist"}
                  </button>
                </div>

                <p className="plan-note">
                  <IconLock size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Illustrative inventory. In a real deployment this panel reads from the
                  developer's live lot availability.
                </p>
              </article>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {compareRows.length > 0 && (
          <motion.div
            className="shortlist"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="shortlist-head">
              <div>
                <h3 className="shortlist-title">Shortlist</h3>
                <p className="shortlist-sub">
                  Lot only, {PLAN_TERMS.dpPct}% down over {PLAN_TERMS.years} years at{" "}
                  {SCHEMES.pagibig.rate}%. Indicative.
                </p>
              </div>
              <button className="plan-short" onClick={clearShortlist}>
                Clear the shortlist
              </button>
            </div>

            <div className="shortlist-grid">
              {compareRows.map(({ lot, monthly, perSqm }) => (
                <article className="shortlist-card" key={lot.id}>
                  <div className="shortlist-card-top">
                    <h4>{lotName(lot)}</h4>
                    {lowestMonthly !== null && monthly === lowestMonthly && (
                      <span className="shortlist-best">Lowest monthly</span>
                    )}
                  </div>
                  <p className="shortlist-meta">{lotSummary(lot)}</p>

                  <dl className="shortlist-rows">
                    <div>
                      <dt>Lot area</dt>
                      <dd>{lot.area} sqm</dd>
                    </div>
                    <div>
                      <dt>Price</dt>
                      <dd>{peso(lot.price)}</dd>
                    </div>
                    <div>
                      <dt>Per sqm</dt>
                      <dd>{peso(perSqm)}</dd>
                    </div>
                    <div>
                      <dt>Monthly</dt>
                      <dd>{peso(monthly)}</dd>
                    </div>
                  </dl>

                  <div className="shortlist-actions">
                    <a
                      className="shortlist-link"
                      href="#plan"
                      onClick={() => selectLot(lot.id)}
                    >
                      Show on the plan
                    </a>
                    <button className="shortlist-link" onClick={() => toggleShortlist(lot.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
