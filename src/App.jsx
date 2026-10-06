import { useEffect } from "react";
import Nav from "./components/Nav";
import ScrollStory from "./components/ScrollStory";
import Address from "./components/Address";
import SitePlan from "./components/SitePlan";
import Homes from "./components/Homes";
import Amenities from "./components/Amenities";
import Financing from "./components/Financing";
import Faq from "./components/Faq";
import Tripping from "./components/Tripping";
import Footer from "./components/Footer";
import useReveal from "./lib/useReveal";
import { VillageProvider } from "./lib/villageState";

export default function App() {
  useReveal();

  /* Ember that follows the pointer across the cards. Each card keeps its own
     local coordinates so the glow sits under the cursor rather than over
     the page - cheap, and the single most visible thing that separates this
     from a static stack of panels. */
  useEffect(() => {
    const onMove = (e) => {
      const el = e.target?.closest?.(".model, .amen, .conn, .chapel-note, .shortlist-card");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <VillageProvider>
      <Nav />
      <main>
        <ScrollStory />
        <Address />
        <SitePlan />
        <Homes />
        <Amenities />
        <Financing />
        <Faq />
        <Tripping />
      </main>
      <Footer />
    </VillageProvider>
  );
}
