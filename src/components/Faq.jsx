import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FAQS } from "../data/village";
import { IconChevron } from "./Icons";

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="section-head reveal">
        <p className="eyebrow">FAQs</p>
        <h2 className="h2">Questions, answered</h2>
      </div>

      <div className="faq reveal reveal-d1">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div className={`faq-item ${isOpen ? "open" : ""}`} key={f.q}>
              <h3>
                <button
                  className="faq-q"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                >
                  {f.q}
                  <span className="faq-chev">
                    <IconChevron size={17} />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="faq-a"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p>{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
