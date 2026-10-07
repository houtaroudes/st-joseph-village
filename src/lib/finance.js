/* ============================================================
   Indicative financing arithmetic.

   Standard annuity amortisation: M = P·r·(1+r)^n / ((1+r)^n − 1)
   where r is the monthly rate and n the number of months.

   This is arithmetic, not an offer of credit - see DISCLAIMER.
   ============================================================ */

import { PAYMENT_TERMS, SCHEMES, LOT_PRICING } from "../data/village.js";

export function monthlyAmortisation(principal, annualRatePct, years) {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / n;
  const growth = Math.pow(1 + r, n);
  return (principal * r * growth) / (growth - 1);
}

export function lotPrice(area, corner = false) {
  const base = area * LOT_PRICING.perSqm;
  return corner ? base * (1 + LOT_PRICING.cornerPremiumPct / 100) : base;
}

/**
 * Full sample computation for a house-and-lot (or lot-only) purchase.
 * Downpayment is spread over `dpMonths`; the reservation fee comes out of it.
 */
export function sampleComputation({
  price,
  dpPct = PAYMENT_TERMS.defaultDpPct,
  dpMonths = PAYMENT_TERMS.defaultDpMonths,
  schemeId = "pagibig",
  years,
}) {
  const scheme = SCHEMES[schemeId] || SCHEMES.pagibig;
  const term = Math.min(years ?? scheme.defaultYears, scheme.maxYears);

  const reservation = PAYMENT_TERMS.reservationFee;
  const downpayment = (price * dpPct) / 100;
  const dpBalance = Math.max(downpayment - reservation, 0);
  const dpMonthly = dpMonths > 0 ? dpBalance / dpMonths : 0;
  const loanable = Math.max(price - downpayment, 0);
  const amortisation = monthlyAmortisation(loanable, scheme.rate, term);
  const miscFees = (price * PAYMENT_TERMS.miscFeePct) / 100;

  // Total cash out over the downpayment period, then the loan service cost.
  const loanTotal = amortisation * term * 12;

  return {
    price,
    reservation,
    dpPct,
    downpayment,
    dpBalance,
    dpMonths,
    dpMonthly,
    loanable,
    scheme,
    term,
    rate: scheme.rate,
    amortisation,
    miscFees,
    loanTotal,
    totalContract: downpayment + loanTotal,
    interestPaid: loanTotal - loanable,
  };
}
