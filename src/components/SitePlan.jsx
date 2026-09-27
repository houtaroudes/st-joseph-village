import { useMemo, useRef, useState } from "react";
import { BLOCKS, LOT_PRICING, peso } from "../data/village";
import { lotPrice } from "../lib/finance";
import { IconArrow, IconLock, IconRuler } from "./Icons";

/* ============================================================
   The site plan.

   This is the piece the reference didn't have. A cinematic scroll looks
   good; a buyer actually wants to see the inventory. Lots are laid out as
   an SVG so they stay crisp at any size, print correctly, and can be
   reached by keyboard - with arrow keys moving between lots and Enter
   selecting one (roving tabindex, so the plan is a single tab stop).
   ============================================================ */

const LOT_W = 52;
const LOT_H = 44;
const GAP = 7;

/* One phase is either a 4x3 block (12 lots) or a 5x2 block (10 lots). The
   wide one is centred on the same column so the two never collide - the
   first pass had phases 5 and 6 sitting on top of phases 3 and 4. */
const BLOCK_W = 4 * LOT_W + 3 * GAP; // 229
const BLOCK_W_WIDE = 5 * LOT_W + 4 * GAP; // 288
const BLOCK_H = 3 * LOT_H + 2 * GAP; // 146
const BLOCK_H_WIDE = 2 * LOT_H + GAP; // 95

const COL_A = 30;
const COL_B = 372;
const COL_C = 650;
const COL_C_WIDE = COL_C + (BLOCK_W - BLOCK_W_WIDE) / 2;

const ROW_TOP = 100;
const ROW_BOTTOM = 330;

const LAYOUT = [
  { phase: 1, x: COL_A, y: ROW_TOP },
  { phase: 2, x: COL_A, y: ROW_BOTTOM },
  { phase: 3, x: COL_B, y: ROW_TOP },
  { phase: 4, x: COL_B, y: ROW_BOTTOM },
  { phase: 5, x: COL_C_WIDE, y: ROW_TOP + (BLOCK_H - BLOCK_H_WIDE) / 2 },
  { phase: 6, x: COL_C_WIDE, y: ROW_BOTTOM + (BLOCK_H - BLOCK_H_WIDE) / 2 },
];

const STATUS_LABEL = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  preselling: "Pre-selling",
};

function statusFor(blockStatus, phase, index) {
  if (blockStatus === "sold") return "sold";
  if (blockStatus === "available") return "available";
  if (blockStatus === "preselling") return "preselling";
  // "mixed" - a phase that has been open for a while.
  const h = (phase * 37 + index * 17) % 100;
  if (h < 55) return "sold";
  if (h < 75) return "reserved";
  return "available";
}

function buildLots() {
  const lots = [];
  LAYOUT.forEach(({ phase, x, y }) => {
    const block = BLOCKS.find((b) => b.phase === phase);
    const single = block.lots === 10;
    const cols = single ? 5 : 4;
    const rows = single ? 2 : 3;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const index = r * cols + c;
        const corner = (r === 0 || r === rows - 1) && (c === 0 || c === cols - 1);
        const area = LOT_PRICING.lotSizes[(phase + index) % LOT_PRICING.lotSizes.length];
        lots.push({
          id: `${phase}-${String(index + 1).padStart(2, "0")}`,
          phase,
          x: x + c * (LOT_W + GAP),
          y: y + r * (LOT_H + GAP),
          area,
          corner,
          status: statusFor(block.status, phase, index),
          price: lotPrice(area, corner),
        });
      }
    }
  });
  return lots;
}

const COLUMNS = 4; // arrow-key stride for the 4×3 phases

export default function SitePlan() {
  const lots = useMemo(() => buildLots(), []);
  const [selectedId, setSelectedId] = useState(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const refs = useRef([]);

  const selected = lots.find((l) => l.id === selectedId) || null;
  const counts = lots.reduce(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] || 0) + 1 }),
    {}
  );

  const move = (from, delta) => {
    const next = Math.min(lots.length - 1, Math.max(0, from + delta));
    setFocusIdx(next);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e, index) => {
    const map = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    };
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedId(lots[index].id);
      return;
    }
    if (map[e.key] !== undefined) {
      e.preventDefault();
      move(index, map[e.key]);
    }
  };

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
              <rect key={`lane-${phase}`} className="road" x={x} y={262} width={BLOCK_W} height={22} rx="5" />
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
            <path d="M329 432v8M325 436h8" stroke="#1F4A38" strokeWidth="2" fill="none" />
            <text className="plan-label" x="329" y="544" textAnchor="middle">St. Joseph Chapel</text>

            {/* Phase labels */}
            {LAYOUT.map(({ phase, x, y }) => (
              <text className="plan-label" key={`label-${phase}`} x={x} y={y - 14}>
                Phase {phase}
              </text>
            ))}
            <text className="plan-label" x="329" y="30" textAnchor="middle">Main avenue</text>

            {/* Lots */}
            {lots.map((lot, i) => (
              <g
                key={lot.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={`lot lot--${lot.status} ${selectedId === lot.id ? "is-active" : ""}`}
                role="button"
                tabIndex={i === focusIdx ? 0 : -1}
                aria-label={`Lot ${lot.id}, phase ${lot.phase}, ${lot.area} square metres, ${STATUS_LABEL[lot.status]}${lot.corner ? ", corner lot" : ""}`}
                onClick={() => setSelectedId(lot.id)}
                onFocus={() => setFocusIdx(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                <rect x={lot.x} y={lot.y} width={LOT_W} height={LOT_H} rx="5" />
                <title>{`Lot ${lot.id} - ${lot.area} sqm - ${STATUS_LABEL[lot.status]}`}</title>
              </g>
            ))}
          </svg>
          </div>
          <p className="plan-scroll-hint">Drag the plan sideways to explore all six phases.</p>

          <div className="legend">
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <span className="legend-item" key={key}>
                <span className={`legend-swatch legend-swatch--${key}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="plan-panel">
          <div className="plan-totals">
            <div className="mini-stat">
              <strong>{counts.available || 0}</strong>
              <span>Available</span>
            </div>
            <div className="mini-stat">
              <strong>{counts.preselling || 0}</strong>
              <span>Pre-selling</span>
            </div>
            <div className="mini-stat">
              <strong>{(counts.sold || 0) + (counts.reserved || 0)}</strong>
              <span>Taken</span>
            </div>
          </div>

          <div aria-live="polite">
            {!selected ? (
              <div className="plan-empty">
                <IconRuler size={20} />
                <p style={{ marginTop: 8 }}>
                  Select a lot on the plan to see its area, status and indicative price.
                </p>
              </div>
            ) : (
              <article className="plan-card">
                <h3>Lot {selected.id}</h3>
                <p className="plan-sub">
                  Phase {selected.phase} · {STATUS_LABEL[selected.status]}
                </p>

                <div className="plan-price">
                  {peso(selected.price)}
                  <small>lot only · house construction optional</small>
                </div>

                <dl className="spec-table">
                  <div className="spec-row">
                    <dt>Lot area</dt>
                    <dd>{selected.area} sqm</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Classification</dt>
                    <dd>{selected.corner ? "Corner lot" : "Inner lot"}</dd>
                  </div>
                  <div className="spec-row">
                    <dt>Rate</dt>
                    <dd>
                      {peso(LOT_PRICING.perSqm)} / sqm
                      {selected.corner ? ` + ${LOT_PRICING.cornerPremiumPct}%` : ""}
                    </dd>
                  </div>
                  <div className="spec-row">
                    <dt>Status</dt>
                    <dd>{STATUS_LABEL[selected.status]}</dd>
                  </div>
                </dl>

                <div className="plan-actions">
                  <a className="btn btn-gold" href="#tripping">
                    Book a tripping for Lot {selected.id} <IconArrow size={15} />
                  </a>
                  <a className="btn btn-ghost" href="#homes">
                    Pair it with a house model
                  </a>
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
    </section>
  );
}
