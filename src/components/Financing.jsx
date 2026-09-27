import { useMemo, useState } from "react";
import { MODELS, PAYMENT_TERMS, SCHEMES, peso } from "../data/village";
import { lotPrice, sampleComputation } from "../lib/finance";
import { IconArrow, IconCheck, IconLock } from "./Icons";

/* A working sample computation rather than a static table. In the
   Philippines the deciding number is the monthly amortisation, and the
   deciding question is always Pag-IBIG versus bank — so both are on the
   panel, side by side, and the arithmetic is real. */

const LOT_OPTION = {
  id: "lot-only",
  name: "Lot only",
  price: lotPrice(150, false),
  note: "150 sqm inner lot",
};

export default function Financing() {
  const [modelId, setModelId] = useState("sampaguita");
  const [schemeId, setSchemeId] = useState("pagibig");
  const [dpPct, setDpPct] = useState(PAYMENT_TERMS.defaultDpPct);
  const [dpMonths, setDpMonths] = useState(PAYMENT_TERMS.defaultDpMonths);
  const [years, setYears] = useState(SCHEMES.pagibig.defaultYears);
  const [copied, setCopied] = useState(false);

  const options = useMemo(
    () => [...MODELS.map((m) => ({ id: m.id, name: m.name, price: m.price, note: `${m.kind} · ${m.lot} sqm lot · ${m.floor} sqm floor` })), LOT_OPTION],
    []
  );
  const model = options.find((o) => o.id === modelId) || options[0];
  const scheme = SCHEMES[schemeId];

  const result = useMemo(
    () => sampleComputation({ price: model.price, dpPct, dpMonths, schemeId, years }),
    [model.price, dpPct, dpMonths, schemeId, years]
  );

  const changeScheme = (id) => {
    setSchemeId(id);
    setYears((y) => Math.min(y, SCHEMES[id].maxYears));
  };

  const summary = [
    `${model.name} — ${peso(result.price)} (illustrative)`,
    `Scheme: ${scheme.label} at ${result.rate}% over ${result.term} years`,
    `Reservation fee: ${peso(result.reservation)} (deductible from the downpayment)`,
    `Downpayment ${dpPct}%: ${peso(result.downpayment)} — ${peso(result.dpMonthly)}/mo for ${dpMonths} months after the reservation fee`,
    `Loanable amount: ${peso(result.loanable)}`,
    `Monthly amortisation: ${peso(result.amortisation)}`,
    `Miscellaneous fees on turnover (approx. ${PAYMENT_TERMS.miscFeePct}%): ${peso(result.miscFees)}`,
    "Illustrative arithmetic only — not an offer of credit. St. Joseph Village is a concept build.",
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="section" id="financing">
      <div className="section-head reveal">
        <p className="eyebrow">Financing</p>
        <h2 className="h2">
          The number that decides it: <em>the monthly.</em>
        </h2>
        <p className="lede">
          Most buyers here choose between Pag-IBIG and a bank, so both are on the same panel. Move
          the terms and the schedule updates — this is real amortisation arithmetic, not a
          marketing table.
        </p>
      </div>

      <div className="calc reveal reveal-d1">
        <div>
          <div className="calc-field">
            <label className="calc-label" htmlFor="calc-model">
              What are you buying
            </label>
            <select
              id="calc-model"
              className="select"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} — {peso(o.price)}
                </option>
              ))}
            </select>
            <p className="plan-note">{model.note}</p>
          </div>

          <div className="calc-field">
            <span className="calc-label">Financing scheme</span>
            <div className="seg">
              {Object.values(SCHEMES).map((s) => (
                <button
                  key={s.id}
                  className="seg-btn"
                  aria-pressed={schemeId === s.id}
                  onClick={() => changeScheme(s.id)}
                >
                  {s.label}
                  <small>{s.rate}% p.a.</small>
                </button>
              ))}
            </div>
            <p className="plan-note">{scheme.note}</p>
          </div>

          <div className="calc-field">
            <span className="calc-label">Downpayment</span>
            <div className="seg">
              {PAYMENT_TERMS.dpOptions.map((p) => (
                <button
                  key={p}
                  className="seg-btn"
                  aria-pressed={dpPct === p}
                  onClick={() => setDpPct(p)}
                >
                  {p}%
                  <small>{peso((model.price * p) / 100)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <span className="calc-label">Spread the downpayment over</span>
            <div className="seg">
              {PAYMENT_TERMS.dpMonths.map((m) => (
                <button
                  key={m}
                  className="seg-btn"
                  aria-pressed={dpMonths === m}
                  onClick={() => setDpMonths(m)}
                >
                  {m} months
                </button>
              ))}
            </div>
          </div>

          <div className="calc-field">
            <label className="calc-label" htmlFor="calc-years">
              Loan term
            </label>
            <input
              id="calc-years"
              className="range"
              type="range"
              min={5}
              max={scheme.maxYears}
              step={1}
              value={Math.min(years, scheme.maxYears)}
              onChange={(e) => setYears(Number(e.target.value))}
            />
            <div className="range-head">
              <span>{Math.min(years, scheme.maxYears)} years</span>
              <span>max {scheme.maxYears} for {scheme.label}</span>
            </div>
          </div>
        </div>

        <div className="calc-out">
          <div className="calc-hero">
            <span className="calc-label">Monthly amortisation</span>
            <div className="calc-figure">
              {peso(result.amortisation)}
              <small> / month for {result.term} years at {result.rate}% p.a.</small>
            </div>
          </div>

          <dl className="calc-rows">
            <div className="calc-row">
              <dt>Contract price</dt>
              <dd>{peso(result.price)}</dd>
            </div>
            <div className="calc-row">
              <dt>Reservation fee</dt>
              <dd>{peso(result.reservation)}</dd>
            </div>
            <div className="calc-row">
              <dt>Downpayment ({dpPct}%)</dt>
              <dd>{peso(result.downpayment)}</dd>
            </div>
            <div className="calc-row">
              <dt>Balance payable over {dpMonths} months</dt>
              <dd>{peso(result.dpMonthly)}/mo</dd>
            </div>
            <div className="calc-row">
              <dt>Loanable amount</dt>
              <dd>{peso(result.loanable)}</dd>
            </div>
            <div className="calc-row">
              <dt>Miscellaneous fees at turnover</dt>
              <dd>{peso(result.miscFees)}</dd>
            </div>
            <div className="calc-row">
              <dt>Interest over the full term</dt>
              <dd>{peso(result.interestPaid)}</dd>
            </div>
          </dl>

          <div className="calc-terms">
            <button className="btn btn-ghost" onClick={copy}>
              {copied ? <IconCheck size={15} /> : null}
              {copied ? "Copied" : "Copy this computation"}
            </button>
            <a className="btn btn-primary" href="#tripping">
              Ask a question <IconArrow size={15} />
            </a>
          </div>

          <p className="calc-note">
            <IconLock size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Indicative arithmetic only and not an offer of credit. Real rates depend on the lender,
            your contribution record and the prevailing policy rate, and are usually repriced after
            the first fixed period. Miscellaneous fees are budgeted, not billed, here.
          </p>
        </div>
      </div>
    </section>
  );
}
