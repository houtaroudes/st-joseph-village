import { DISCLAIMER, VILLAGE } from "../data/village";
import { IconChapel } from "./Icons";

/* The disclaimer is not a footnote in the legal sense — it is the reason
   this page can exist at all. It stays rendered, in the footer, on every
   viewport. */

export default function Footer() {
  return (
    <footer className="foot">
      <div className="foot-inner">
        <div className="foot-top">
          <div>
            <p className="foot-brand">
              St. Joseph Village
              <span>San Pedro · Laguna · Concept build</span>
            </p>
          </div>
          <nav className="foot-links" aria-label="Footer">
            <a href="#address">The address</a>
            <a href="#plan">Site plan</a>
            <a href="#homes">Homes</a>
            <a href="#amenities">Village</a>
            <a href="#financing">Financing</a>
            <a href="#faq">FAQs</a>
            <a href="#tripping">Book a tripping</a>
          </nav>
        </div>

        <div className="disclaimer">
          <div className="disclaimer-head">
            <h4>{DISCLAIMER.badge}</h4>
            <span className="chip chip-gold">{DISCLAIMER.short}</span>
          </div>
          {DISCLAIMER.long.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="foot-bottom">
          <span>
            <IconChapel size={13} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            {VILLAGE.name} — an interactive landing page concept. Not a real subdivision.
          </span>
          <span>Built by Bryan Sacueza. Illustrative content only.</span>
        </div>
      </div>
    </footer>
  );
}
