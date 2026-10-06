import { LOT_PRICING, MODELS, peso } from "../data/village";
import { useVillage } from "../lib/useVillage";
import { IconArrow, IconCheck } from "./Icons";

export default function Homes() {
  const { computeFor } = useVillage();

  return (
    <section className="section" id="homes">
      <div className="section-head reveal">
        <p className="eyebrow">The homes</p>
        <h2 className="h2">
          Five models, <em>one village.</em>
        </h2>
        <p className="lede">
          Buy the lot on its own and build when you are ready, or take a house-and-lot package and
          move in. Every model is designed to fit the standard {LOT_PRICING.minimumArea} sqm lot and up.
        </p>
      </div>

      <div className="model-grid">
        {MODELS.map((m, i) => (
          <article
            className={`model reveal reveal-d${(i % 3) + 1} ${m.featured ? "model--featured" : ""}`}
            key={m.id}
          >
            <div className="model-top">
              <div>
                <p className="model-kind">{m.kind}</p>
                <h3 className="model-name">{m.name}</h3>
              </div>
              {m.featured && <span className="chip chip-gold">Most requested</span>}
            </div>
            <p className="model-blurb">{m.blurb}</p>

            <div className="model-specs">
              <span className="spec-pill">{m.lot} sqm lot</span>
              <span className="spec-pill">{m.floor} sqm floor</span>
              <span className="spec-pill">
                {m.beds} {m.beds > 1 ? "bedrooms" : "bedroom"}
              </span>
              <span className="spec-pill">
                {m.baths} {m.baths > 1 ? "baths" : "bath"}
              </span>
            </div>

            <ul className="feature-list">
              {m.features.map((f) => (
                <li key={f}>
                  <IconCheck size={13} /> {f}
                </li>
              ))}
            </ul>

            <div className="model-foot">
              <div className="model-price">
                {peso(m.price)}
                <small>house &amp; lot · indicative</small>
              </div>
              {/* This used to be a plain anchor to #financing, so clicking
                  Aralia scrolled to a calculator still priced on Sampaguita.
                  It now loads the card you actually clicked. */}
              <a
                className="btn btn-ghost"
                href="#financing"
                onClick={() => computeFor(`model:${m.id}`)}
              >
                Compute this <IconArrow size={14} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
