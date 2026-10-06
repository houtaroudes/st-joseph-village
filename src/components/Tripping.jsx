import { useMemo, useState } from "react";
import { CONTACT, MODELS } from "../data/village";
import { lotName, lotSummary } from "../lib/lots";
import { useVillage } from "../lib/useVillage";
import { IconArrow, IconCalendar, IconChat, IconClock, IconLock, IconMail, IconPhone, IconPin } from "./Icons";

/* In the Philippines the conversion is a tripping - the site visit - and
   the channel is usually Messenger, not email. Both are here.

   The submit is deliberately local: the form validates, shows its success
   state, and transmits nothing. A real deployment would point it at a
   form endpoint and would need the privacy notice linked in the consent
   line. Pretending to email a fictional sales office would be the one
   part of this build that could actually mislead somebody. */

const SLOTS = ["Morning (9-12)", "Afternoon (1-4)", "Late afternoon (4-6)"];

/* A date field that accepts yesterday is a form that has to be re-filled
   after a failed submit. Local date, not toISOString: that one is UTC, and
   in Manila it would offer yesterday as "today" until 8am. */
const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const lotValue = (lot) => `lot:${lot.id}`;

export default function Tripping() {
  const { selectedLot, shortlistLots } = useVillage();
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [channel, setChannel] = useState(null);

  const lotChoices = useMemo(() => {
    const list = [];
    const seen = new Set();
    const push = (lot) => {
      if (!lot || seen.has(lot.id)) return;
      seen.add(lot.id);
      list.push(lot);
    };
    push(selectedLot);
    shortlistLots.forEach(push);
    return list;
  }, [selectedLot, shortlistLots]);

  return (
    <section className="trip" id="tripping">
      <div className="trip-inner">
        <div className="trip-info">
          <div>
            <p className="eyebrow">Book a tripping</p>
            <h2 className="h2" style={{ color: "var(--ivory)" }}>
              Come see it before you decide.
            </h2>
            <p className="lede" style={{ marginTop: 12 }}>
              Pick a day and we will walk you through the phase you are interested in: the avenue,
              the plaza, the chapel and the lots that are still open.
            </p>
          </div>

          <div className="trip-line">
            <IconPin size={16} />
            <span>{CONTACT.office}</span>
          </div>
          <div className="trip-line">
            <IconClock size={16} />
            <span>{CONTACT.officeHours}</span>
          </div>
          <div className="trip-line">
            <IconPhone size={16} />
            <span>{CONTACT.salesPhone}</span>
          </div>
          <div className="trip-line">
            <IconMail size={16} />
            <span>{CONTACT.salesEmail}</span>
          </div>

          <div className="trip-map">
            <iframe
              title="Google Map of San Pedro, Laguna - where St. Joseph Village is set"
              src="https://www.google.com/maps?q=San+Pedro%2C+Laguna&z=14&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <p className="plan-note" style={{ color: "rgba(246,241,231,0.55)" }}>
            <IconPin size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            Interactive Google Map. The pin is the city center. The village is a concept, so no
            surveyed boundary is drawn on it.
          </p>
        </div>

        <div>
          {selectedLot && (
            <p className="trip-context">
              <IconPin size={14} />
              Enquiring about <strong>{lotName(selectedLot)}</strong> · {lotSummary(selectedLot)}
            </p>
          )}
          {sent ? (
            <div className="form-done">
              <h3>Thanks. That is the whole interaction.</h3>
              <p>
                Nothing was transmitted. This form is here to demonstrate the flow: validation, the
                consent gate, and the success state.
              </p>
              <p>
                In a live deployment the details above would be delivered to the sales team, and the
                submission would be logged with the date, time and consent record required under the
                Data Privacy Act.
              </p>
              <button className="btn btn-ghost" style={{ marginTop: 16, borderColor: "rgba(246,241,231,0.4)", color: "var(--ivory)" }} onClick={() => setSent(false)}>
                Reset the form
              </button>
            </div>
          ) : (
            <form
              className="trip-form"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <div className="form-row">
                <div className="field">
                  <label htmlFor="trip-name">Full name</label>
                  <input id="trip-name" className="input" name="name" placeholder="Juan dela Cruz" required />
                </div>
                <div className="field">
                  <label htmlFor="trip-phone">Mobile number</label>
                  <div className="phone-group">
                    <span className="phone-prefix">+63</span>
                    <input
                      id="trip-phone"
                      className="input"
                      name="phone"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      placeholder="917 000 0000"
                      title="Ten digits after +63, e.g. 9170000000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="trip-email">Email</label>
                <input id="trip-email" className="input" type="email" name="email" placeholder="juan@email.com" required />
              </div>

              <div className="form-row">
                <div className="field">
                  <label htmlFor="trip-date">Preferred date</label>
                  <input
                    id="trip-date"
                    className="input"
                    type="date"
                    name="date"
                    min={todayISO()}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="trip-slot">Time slot</label>
                  <select id="trip-slot" className="select" name="slot" defaultValue={SLOTS[0]}>
                    {SLOTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="trip-interest">Interested in</label>
                {/* The plan's primary button says "Book a tripping for Lot
                    3-07", so the form has to arrive holding Lot 3-07. It did
                    not before: the button made a specific promise and the
                    field silently dropped it. Keyed on the lot so switching
                    lot resets the field to the new default, which is what
                    the previous effect was doing the long way round. */}
                <select
                  key={selectedLot?.id ?? "none"}
                  id="trip-interest"
                  className="select"
                  name="interest"
                  defaultValue={selectedLot ? lotValue(selectedLot) : "lot-only"}
                >
                  {lotChoices.map((lot) => (
                    <option key={lot.id} value={lotValue(lot)}>
                      {`${lotName(lot)} - ${lot.area} sqm, Phase ${lot.phase}`}
                    </option>
                  ))}
                  <option value="lot-only">Lot only</option>
                  {MODELS.map((m) => (
                    <option key={m.id} value={`model:${m.id}`}>{`${m.name} - ${m.kind}`}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="trip-message">Anything we should know</label>
                <textarea
                  id="trip-message"
                  className="textarea"
                  name="message"
                  rows={3}
                  placeholder="Looking to move in before the school year, ideally a corner lot."
                />
              </div>

              <label className="consent" htmlFor="trip-consent">
                <input
                  id="trip-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                />
                <span>
                  I agree that {`Ilaya Land & Homes`} may contact me about this inquiry. I have read
                  the <a href="#faq">privacy notice</a>, and I understand this is a design
                  demonstration and not a real company. <br />
                  <span style={{ opacity: 0.7 }}>
                    In a live build this links to the developer's published privacy notice under RA
                    10173.
                  </span>
                </span>
              </label>

              <div className="form-foot">
                <button className="btn btn-gold" type="submit" disabled={!consent}>
                  Request a tripping <IconArrow size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ borderColor: "rgba(246,241,231,0.4)", color: "var(--ivory)" }}
                  onClick={() => setChannel(channel ? null : "messenger")}
                >
                  <IconChat size={15} /> Message us instead
                </button>
              </div>

              {!consent && (
                <p className="form-status">
                  <IconLock size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                  Consent is required before the form will submit; that is the point of the checkbox.
                </p>
              )}
              {channel && (
                <p className="form-status">
                  In a live build this opens the sales team's Messenger, which is where most
                  inquiries actually arrive.
                </p>
              )}
              <p className="form-status">
                <IconCalendar size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                Demo form: submitting sends nothing, anywhere.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
