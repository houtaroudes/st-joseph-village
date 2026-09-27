import { useEffect, useState } from "react";
import { IconChapel, IconArrow } from "./Icons";

const LINKS = [
  { href: "#address", label: "The address" },
  { href: "#plan", label: "Site plan" },
  { href: "#homes", label: "Homes" },
  { href: "#amenities", label: "Village" },
  { href: "#financing", label: "Financing" },
  { href: "#faq", label: "FAQs" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`}>
      <a className="nav-brand" href="#top" onClick={() => setOpen(false)}>
        <span className="nav-crest">
          <IconChapel size={18} />
        </span>
        <span>
          <span className="nav-name">St. Joseph Village</span>
          <span className="nav-place">San Pedro · Laguna</span>
        </span>
      </a>

      <nav className="nav-links" aria-label="Sections">
        {LINKS.map((l) => (
          <a key={l.href} className="nav-link" href={l.href}>
            {l.label}
          </a>
        ))}
      </nav>

      <div className="nav-right">
        <span className="chip" title="Design demonstration, not a real listing">
          Concept build
        </span>
        <a className="btn btn-primary nav-cta" href="#tripping">
          Book a tripping
        </a>
        <button
          className="nav-burger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="nav-menu">
          {LINKS.map((l) => (
            <a key={l.href} className="nav-menu-link" href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a className="btn btn-primary" href="#tripping" onClick={() => setOpen(false)}>
            Book a tripping <IconArrow size={15} />
          </a>
        </div>
      )}
    </header>
  );
}
