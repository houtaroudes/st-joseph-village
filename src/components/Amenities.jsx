import { AMENITIES } from "../data/village";
import { IconBolt, IconChapel, IconCourt, IconHall, IconPark, IconPlay, IconShield, IconWater } from "./Icons";

const AMENITY_ICONS = {
  chapel: IconChapel,
  hall: IconHall,
  court: IconCourt,
  play: IconPlay,
  park: IconPark,
  shield: IconShield,
  water: IconWater,
  bolt: IconBolt,
};

export default function Amenities() {
  const hero = AMENITIES.find((a) => a.hero);
  const rest = AMENITIES.filter((a) => !a.hero);

  return (
    <section className="section" id="amenities">
      <div className="section-head reveal">
        <p className="eyebrow">The village</p>
        <h2 className="h2">
          Amenities you will actually <em>use.</em>
        </h2>
        <p className="lede">
          Not a list of features: the everyday things that make a subdivision feel like a village
          rather than a row of houses. The chapel sits at the centre of the plan, on the plaza at
          the head of the avenue.
        </p>
      </div>

      <div className="amen-grid">
        {hero && (
          <article className="amen amen--hero reveal">
            <span className="amen-icon">
              <AMENITY_ICONS.chapel size={26} />
            </span>
            <p className="amen-kicker">The heart of the plan</p>
            <h3>{hero.name}</h3>
            <p>{hero.desc}</p>
          </article>
        )}

        {rest.map((a, i) => {
          const Icon = AMENITY_ICONS[a.icon];
          return (
            <article className={`amen reveal reveal-d${(i % 3) + 1}`} key={a.id}>
              <span className="amen-icon">{Icon ? <Icon size={20} /> : null}</span>
              <h3>{a.name}</h3>
              <p>{a.desc}</p>
            </article>
          );
        })}
      </div>

      <div className="chapel-row reveal">
        <div className="chapel-note">
          <strong>180</strong>
          <span>seats in the village chapel, with a covered patio for baptisms and weddings</span>
        </div>
        <div className="chapel-note">
          <strong>1.2 km</strong>
          <span>jogging loop threaded through six pocket parks and a linear garden</span>
        </div>
        <div className="chapel-note">
          <strong>24/7</strong>
          <span>guarded gate with resident and visitor lanes and CCTV on the perimeter</span>
        </div>
      </div>
    </section>
  );
}
