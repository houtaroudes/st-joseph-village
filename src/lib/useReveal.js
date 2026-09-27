import { useEffect } from "react";

/** Adds `.visible` to every `.reveal` element once it scrolls into view. */
export default function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    const scan = () => document.querySelectorAll(".reveal:not(.visible)").forEach((el) => observer.observe(el));
    scan();
    // Sections render in one pass, but the site plan and calculator swap
    // content on interaction - catch anything that appears later.
    const t = setTimeout(scan, 400);
    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, []);
}
