import { CONNECTIONS, VILLAGE } from "../data/village";
import { IconCheck, IconPin, IconRuler, IconRoad } from "./Icons";

/* The map is the keyless Google Maps embed — an interactive map with no API
   key and no billing, which is what a concept build should ship. A
   production deployment would swap the `src` for the Maps JavaScript API to
   drop surveyed pins, lot boundaries and a Walking/Biking layer. */
const MAP_SRC =
  "https://www.google.com/maps?q=San+Pedro%2C+Laguna&z=14&output=embed";

export default function Address() {
  return (
    <section className="section" id="address">
      <div className="section-head reveal">
        <p className="eyebrow">The address</p>
        <h2 className="h2">
          Brgy. {VILLAGE.location.barangay}, <em>{VILLAGE.location.city}</em>
        </h2>
        <p className="lede">
          On the ridge side of the city, minutes from the South Luzon Expressway — with the schools,
          hospitals and malls of San Pedro and Biñan close at hand.
        </p>
      </div>

      <div className="address-split">
        <div className="address-grid reveal reveal-d1">
          {CONNECTIONS.map((c) => (
            <article className="conn" key={c.place}>
              <div className="conn-top">
                <span className="conn-place">{c.place}</span>
                <span className="conn-time">{c.minutes}′</span>
              </div>
              <p className="conn-meta">
                {c.km} km · {c.note}
              </p>
            </article>
          ))}
        </div>

        <aside className="address-side reveal reveal-d2">
          <div className="fact-card">
            <p className="eyebrow" style={{ color: "var(--gold-soft)" }}>At a glance</p>
            <h3>{VILLAGE.name}</h3>
            <ul className="fact-list">
              <li>
                <IconRuler size={15} /> {VILLAGE.scale.hectares} hectares · {VILLAGE.scale.phases} phases
              </li>
              <li>
                <IconPin size={15} /> {VILLAGE.scale.homes.toLocaleString("en-PH")} homes at full build-out
              </li>
              <li>
                <IconCheck size={15} /> {VILLAGE.scale.density}
              </li>
              <li>
                <IconRoad size={15} /> Three internal streets, one entrance avenue
              </li>
            </ul>
          </div>

          <div className="chapel-note">
            <strong>60%</strong>
            <span>of the plan is open space, roads and amenities</span>
          </div>
        </aside>
      </div>

      <figure className="address-map reveal">
        <iframe
          title="Map of San Pedro, Laguna — the area where St. Joseph Village is set"
          src={MAP_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <figcaption>
          <IconPin size={13} /> Interactive Google Map. The pin is the city center — the village is a
          concept, so no surveyed boundary is shown.
        </figcaption>
      </figure>
    </section>
  );
}
