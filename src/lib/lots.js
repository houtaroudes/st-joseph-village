/* ============================================================
   The site plan as data.

   Lifted out of the component on Oct 6, 2026 for one reason: the lot
   inventory stopped being the plan's private business. The financing
   panel has to price a real lot, the tripping form has to name the lot
   you clicked, and the shared state has to resolve a lot id from a URL.
   All three would have had to import the SVG to do it.

   Six phases: four 4x3 blocks of twelve and two 5x2 blocks of ten, which
   is 68 lots. The wide blocks are centred on their own column so they
   never collide with the blocks above them.

   Every figure is illustrative, like the rest of the content model.
   ============================================================ */

import { BLOCKS, LOT_PRICING } from "../data/village";
import { lotPrice } from "./finance";

export const LOT_W = 52;
export const LOT_H = 44;
export const GAP = 7;

export const BLOCK_W = 4 * LOT_W + 3 * GAP; // 229
export const BLOCK_W_WIDE = 5 * LOT_W + 4 * GAP; // 288
const BLOCK_H = 3 * LOT_H + 2 * GAP; // 146
const BLOCK_H_WIDE = 2 * LOT_H + GAP; // 95

export const COL_A = 30;
export const COL_B = 372;
export const COL_C_WIDE = 650 + (BLOCK_W - BLOCK_W_WIDE) / 2; // 620.5

export const ROW_TOP = 100;
export const ROW_BOTTOM = 330;

/* phase -> the top-left corner of its block on the 980x620 canvas */
export const LAYOUT = [
  { phase: 1, x: COL_A, y: ROW_TOP },
  { phase: 2, x: COL_A, y: ROW_BOTTOM },
  { phase: 3, x: COL_B, y: ROW_TOP },
  { phase: 4, x: COL_B, y: ROW_BOTTOM },
  { phase: 5, x: COL_C_WIDE, y: ROW_TOP + (BLOCK_H - BLOCK_H_WIDE) / 2 },
  { phase: 6, x: COL_C_WIDE, y: ROW_BOTTOM + (BLOCK_H - BLOCK_H_WIDE) / 2 },
];

export const STATUS_LABEL = {
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  preselling: "Pre-selling",
};

/* Ordered most buyable first. The filter chips read in this order, which
   is also the order of the question a buyer actually asks. */
export const STATUS_ORDER = ["available", "preselling", "reserved", "sold"];

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
        const lx = x + c * (LOT_W + GAP);
        const ly = y + r * (LOT_H + GAP);
        lots.push({
          id: `${phase}-${String(index + 1).padStart(2, "0")}`,
          phase,
          row: r,
          col: c,
          x: lx,
          y: ly,
          // Centres up front: keyboard navigation moves to the nearest lot in
          // the direction of the arrow, and that needs a point per lot.
          cx: lx + LOT_W / 2,
          cy: ly + LOT_H / 2,
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

export const LOTS = buildLots();

export const LOT_BY_ID = Object.fromEntries(LOTS.map((l) => [l.id, l]));

/** id -> position in LOTS, so a ref array stays indexed by the full set. */
export const LOT_INDEX = Object.fromEntries(LOTS.map((l, i) => [l.id, i]));

/** The distinct lot sizes, ascending, for the size filter. */
export const LOT_SIZES = [...new Set(LOTS.map((l) => l.area))].sort((a, b) => a - b);

/** "Lot 3-07" - the one place that string is built. */
export const lotName = (lot) => `Lot ${lot.id}`;

/** The short one-line description the answers and the form reuse. */
export const lotSummary = (lot) =>
  `${lot.area} sqm ${lot.corner ? "corner" : "inner"} lot - Phase ${lot.phase}, ${STATUS_LABEL[
    lot.status
  ].toLowerCase()}`;
