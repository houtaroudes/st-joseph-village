import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrow, IconChevron } from "./Icons";

/* Three.js is a third of the bundle, and most of the traffic to a page like
   this is mobile on metered data. So the scene is code-split and the
   gradient poster holds the frame until (and unless) it arrives. */
const VillageScene = lazy(() => import("./VillageScene"));

/* The cinematic opening, in the same spirit as the reference: one pinned
   viewport, a flying camera, and copy beats that hand off to each other as
   the page scrolls. The difference is the world — that one shipped with
   fourteen painted WebP layers, this one is generated at runtime. */

const BEATS = [
  {
    eyebrow: "San Pedro, Laguna",
    title: "A village built around a chapel.",
    text: "Twenty-four hectares off the South Luzon Expressway, planned around a village chapel and a plaza you can walk to from any phase.",
    facts: ["24 hectares", "6 phases", "1,180 homes"],
  },
  {
    eyebrow: "Through the gate",
    title: "One avenue, straight to the plaza.",
    text: "A single tree-lined avenue runs the length of the village, crossed by three internal streets. No through-traffic, no dead ends you have to reverse out of.",
    facts: ["Gated entrance", "24-hour security", "Underground drainage"],
  },
  {
    eyebrow: "The address",
    title: "35 minutes to Alabang. An hour to Makati.",
    text: "Close enough to commute, far enough that the evenings are quiet — with schools, hospitals and the expressway entrance all inside a short drive.",
    facts: ["SLEX · 33 km to Makati", "Skyway access", "SM San Pedro · 8 min"],
  },
  {
    eyebrow: "The plan",
    title: "Walk the whole village before you buy.",
    text: "Every lot, every phase, every open space on one interactive plan — click a lot to see its area, its status and what it would cost.",
    facts: ["Live inventory", "Lot-only or house-and-lot"],
    cta: { label: "Open the site plan", href: "#plan" },
  },
];

export default function ScrollStory() {
  const sectionRef = useRef(null);
  const barRef = useRef(null);
  const glowRef = useRef(null);
  const progressRef = useRef(0);
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);
  const [mood, setMood] = useState("dusk");
  const [failed, setFailed] = useState(false);
  // Synced outside render: the keyboard handler reads the current beat, and
  // writing refs during render is both unsafe and lint-frowned-upon.
  useEffect(() => {
    beatRef.current = beat;
  }, [beat]);
  // Derived once at mount rather than set from an effect: the step-down is
  // a property of the device, not of anything that changes later.
  const [quality] = useState(() => {
    if (typeof window === "undefined") return "low";
    const coarse = window.matchMedia?.("(pointer: coarse)").matches;
    const small = window.innerWidth < 820;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return coarse || small || reduced ? "low" : "high";
  });

  /* The screen half of the pointer light: a warm wash that sits under the
     cursor, on top of the 3D ember, so the glow reads even on the beats
     where the camera is looking away from the village. Desktop only — on
     touch it would just sit in the middle of the frame. */
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return undefined;
    if (window.matchMedia?.("(pointer: coarse)").matches) return undefined;
    const onMove = (e) => {
      const r = glow.getBoundingClientRect();
      glow.style.setProperty("--gx", `${e.clientX - r.left}px`);
      glow.style.setProperty("--gy", `${e.clientY - r.top}px`);
      glow.style.opacity = "1";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = section.offsetHeight - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      progressRef.current = p;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      const next = Math.min(BEATS.length - 1, Math.floor(p * BEATS.length * 0.999));
      setBeat((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = BEATS[beat];

  /* Scroll the pinned section to a specific beat. The rail, the keyboard
     shortcuts and the progress readout all resolve through here, so
     "scene 3" always means the same scroll position. */
  const goTo = (i) => {
    const section = sectionRef.current;
    if (!section) return;
    const travel = section.offsetHeight - window.innerHeight;
    const y = section.offsetTop + (i / (BEATS.length - 1)) * travel;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };

  /* Keyboard: while the cinematic is what you are looking at, the arrow
     keys move between scenes instead of nudging the page by a few pixels. */
  useEffect(() => {
    const DIR = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, PageDown: 1, PageUp: -1 };
    const onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      if (e.key === "Home") { e.preventDefault(); goTo(0); return; }
      if (e.key === "End") { e.preventDefault(); goTo(BEATS.length - 1); return; }
      if (DIR[e.key] === undefined) return;
      e.preventDefault();
      const next = Math.min(BEATS.length - 1, Math.max(0, beatRef.current + DIR[e.key]));
      if (next !== beatRef.current) goTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="story" id="top" ref={sectionRef}>
      <div className="story-sticky">
        {failed ? (
          <div className="story-poster" aria-hidden="true" />
        ) : (
          <Suspense fallback={<div className="story-poster" aria-hidden="true" />}>
            <VillageScene progressRef={progressRef} quality={quality} mood={mood} onFail={() => setFailed(true)} />
          </Suspense>
        )}
        <div className="story-veil" aria-hidden="true" />
        <div className="story-glow" ref={glowRef} aria-hidden="true" />

        <div className="story-mood" role="group" aria-label="Time of day">
          <button className="mood-btn" aria-pressed={mood === "dusk"} onClick={() => setMood("dusk")}>
            Dusk
          </button>
          <button className="mood-btn" aria-pressed={mood === "night"} onClick={() => setMood("night")}>
            Night
          </button>
        </div>

        <nav className="story-rail" aria-label="Scene navigation">
          {BEATS.map((b, i) => (
            <button
              key={b.eyebrow}
              className="story-rail-btn"
              aria-current={beat === i ? "true" : undefined}
              onClick={() => goTo(i)}
              title={`Scene ${i + 1} — ${b.title}`}
            >
              <span className="rail-label">{b.eyebrow}</span>
              <span className="rail-dot" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className="story-beats">
          <AnimatePresence mode="wait">
            <motion.div
              key={beat}
              className="beat"
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="beat-eyebrow">{active.eyebrow}</p>
              <h1 className="beat-title">{active.title}</h1>
              <p className="beat-text">{active.text}</p>
              <div className="beat-facts">
                {active.facts.map((f) => (
                  <span className="beat-fact" key={f}>
                    {f}
                  </span>
                ))}
              </div>
              {active.cta && (
                <a className="btn btn-gold beat-cta" href={active.cta.href}>
                  {active.cta.label} <IconArrow size={15} />
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="story-progress">
          <span>
            {String(beat + 1).padStart(2, "0")} / {String(BEATS.length).padStart(2, "0")}
          </span>
          <span className="story-bar">
            <span ref={barRef} />
          </span>
          <span className="story-kbd">
            <kbd>←</kbd>
            <kbd>→</kbd>
            move between scenes
          </span>
        </div>

        {beat < BEATS.length - 1 && (
          <div className="story-scroll">
            Scroll <IconChevron size={13} />
          </div>
        )}
      </div>
    </section>
  );
}
