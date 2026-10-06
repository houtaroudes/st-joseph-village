# St. Joseph Village

An interactive landing page for a fictional gated residential village in San Pedro, Laguna,
built as a **design and development demonstration**.

> **Concept build.** St. Joseph Village, the developer name, the house models, the prices, the lot
> inventory and the availability shown are invented. Nothing here is an offer to sell, a
> reservation, or a representation of any existing project. See [Legal](#legal) below.

## What it is

A subdivision landing page with the things an actual subdivision page needs and usually gets wrong:

- **A cinematic scroll opening.** One pinned viewport, a camera flying from outside the gate, along
  the avenue, up over the village to the chapel plaza, with four copy beats handing off as you scroll.
- **A generated 3D world.** The village is built from geometry at runtime - see below.
- **An interactive site plan.** Six phases, 68 lots, clickable, numbered, with real status, real
  areas and a computed price. Keyboard navigable: the arrow keys move to the nearest lot on the drawn
  plan, Enter selects, and the plan is a single tab stop (roving tabindex).
- **Filtering, a shortlist, and a shareable lot.** The legend doubles as the filter, so soloing
  Available ghosts the other 41 lots rather than hiding them: the plan keeps its shape and the map
  stops lying about where the rest of the inventory is. Up to three lots can be set aside and are
  priced side by side on identical terms, with the lowest monthly marked. The open lot is mirrored
  into the URL, so it can be sent to somebody, and it carries through into the financing panel and
  the tripping form instead of being dropped at the door.
- **A financing panel that does the arithmetic.** Reservation fee, downpayment spread, loanable
  amount and monthly amortisation across Pag-IBIG, bank and in-house terms: the choice a Philippine
  buyer actually makes.
- **A tripping form.** The site visit is the conversion here, not "contact us", with a required
  privacy consent, a `+63` mobile field, and a Messenger fallback, because that is where inquiries
  arrive.
- **A dusk/night switch.** One table drives sky, fog, exposure, every light and every material, so
  changing the hour re-tints the live scene instead of rebuilding it.
- **Navigation that is not just scrolling.** A scene rail on the right jumps between the four beats
  (click it, or tab to it), and while the cinematic is in view the arrow keys, Page Up / Page Down,
  Home and End move between scenes. The rail and the keyboard resolve through one `goTo()`, so
  "scene 3" is always the same scroll position.
- **A pointer that lights the world.** A warm ember rides just ahead of the camera and tracks the
  cursor (on touch, it centres itself ahead of the view); a screen-space glow sits under the pointer
  over the cinematic, and every card carries a matching ember.
- **An interactive Google Map.** The address section embeds Google Maps with no API key and no billing,
  centred on San Pedro, Laguna.

## Look and feel

Charcoal `#0A0807`, bone `#F4EFE7`, vermilion `#E8442A`, ember `#FF7A45`, ember gold `#F5A44C`,
charred panel `#241109`. A modern UI pairing: **Space Grotesk** for the display, capped at the 72px
heading ceiling, with **Plus Jakarta Sans** for the body. Both are sans-only, so nothing reads as a
stock editorial serif.

This palette is deliberately the inverse of the limestone-and-forest first pass, which read as
generic. The ember lives in the light sources (sky, lamps, windows, the cursor) and in the UI
accents, rather than being poured over every surface.

## Why the village is generated instead of photographed

The original reference for this build shipped fourteen hand-painted WebP scene layers, eight audio
tracks and a licensed font. None of that transfers: a real subdivision page would use the developer's
architectural renders and drone footage, and this build has none of those.

Rather than fill the gap with **stock photography of a different subdivision**, which would be both a
poor demonstration and a misrepresentation, the ground, roads, houses, trees, street lamps, gate
arch, clubhouse and chapel are all generated from geometry and a seeded PRNG. Consequences:

- Nothing on the page depicts a real place, so nothing on it can mislead someone about a real property.
- There are no binary assets to license, and the repository is text only.
- The layout is deterministic: `mulberry32(20260927)` means the same village every reload.

The houses are the five models from the price list, built for real: Aralia is a flat-roofed row of
three attached townhouses, Ilang-Ilang a single-storey hip, Sampaguita and Narra gabled (Narra with a
ground-floor bay), and Molave the premium two-storey with a raised foyer and a covered lanai. They are
mixed along the avenue by weighted band, so the walkthrough passes the entry models at the gate and
the premium ones as it reaches the chapel, with the ridge-side columns taking the next model up. Doors,
canopies, concrete paths, party walls, glazed ground floors and lit upstairs windows are all drawn as
**instanced meshes**, so the extra architecture costs no extra draw calls; only the walls and the roof
stay one mesh per house.

Audio is deliberately absent. Autoplay is blocked, surprise sound is a bounce, and the tracks would be
dead weight on mobile data.

## Performance

The scene is **code-split**: Three.js and its renderer are most of the bundle and are lazy-loaded,
with a CSS gradient poster holding the frame until they arrive (or forever, if they fail):

| chunk | size | gzip |
| --- | --- | --- |
| `index.js` | ~405 kB | ~128 kB |
| `VillageScene.js` | ~927 kB | ~248 kB |

The scene was hand-written Three.js at ~550 kB (139 kB gzip) until Oct 3, 2026, when it was rebuilt
as declarative components on **`@react-three/fiber`**, a React renderer for Three.js. That costs
roughly **108 kB gzipped**, which is the price of bringing React's reconciler along: it is the one
real regression in the switch, and it is paid only by visitors who scroll into the cinematic, because
the chunk is lazy and the poster holds the frame in the meantime.

The buyer path added on Oct 6, 2026 (filtering, the shortlist, the shared lot state, the comparison
arithmetic) cost about 8 kB on `index.js`, which is 3 kB gzipped. That is the whole price of the
interaction layer, and it lands on the page rather than inside the scene chunk.

Also: pixel ratio capped at 1.75 (1.2 on the low tier), drawing pauses when the canvas leaves the
viewport or the tab is hidden, `prefers-reduced-motion` renders a single composed frame instead of a
loop, coarse pointers skip parallax entirely, and a WebGL failure falls back to the gradient poster
rather than a blank screen.

## Structure

```
src/
  data/village.js         all content: village, connections, models, lots, amenities,
                          financing terms, FAQs, and the disclaimer
  lib/finance.js          annuity amortisation + the full sample computation
  lib/lots.js             the lot inventory: layout, sizes, status, geometry
  lib/villageState.jsx    the shared buyer path: open lot, shortlist, calculator target
  lib/useVillage.js       the context and hook that read it
  lib/useReveal.js        IntersectionObserver reveal
  scene/
    World.jsx             the village as declarative components: sky, lights, ground,
                          roads, houses, chapel, halls, gate, lamps, trees
    CameraRig.jsx         scroll-driven camera path, drift, pointer parallax, ember light
    plan.js               the generated layout: seeded placement, ground, tree scatter
    materials.js          the shared material set, mood application, geometry
    moods.js              the dusk and night colour tables
  components/
    VillageScene.jsx      the react-three-fiber canvas and the render-loop tiers
    ScrollStory.jsx       the pinned cinematic opening and its beats
    SitePlan.jsx          the interactive SVG plan, lot detail panel
    Financing.jsx         the calculator
    Tripping.jsx          the form and its consent gate
    Nav / Address / Homes / Amenities / Faq / Footer / Icons
```

`src/data/village.js` is the file to edit first: every number on the page comes from it, and the
disclaimer lives there too.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint       # oxlint
```

## Legal

This section is the reason the build can be honest, so it is not optional.

1. **It is a demonstration.** The developer, the project, the prices and the inventory are invented.
   The page says so in the navigation, in the footer, and in the first FAQ.
2. **No license to sell is claimed.** A real subdivision in the Philippines may only be advertised or
   sold with a License to Sell from the **Department of Human Settlements and Urban Development
   (DHSUD)** under **PD 957**, and a genuine listing is required to display it. This page displays
   none, because there is none.
3. **Prices are illustrative.** Financing figures are arithmetic, not an offer of credit. Pag-IBIG
   and bank terms are set by the lender and move with the policy rate.
4. **The form transmits nothing.** It validates, gates on consent, and shows a success state: no
   endpoint, no storage. A production version collecting a name, mobile number and email would need a
   published privacy notice and explicit consent under the **Data Privacy Act of 2012 (RA 10173)**.
   The `pattern`/`inputMode` mobile field is `+63`-aware for the same reason it exists at all.

If this is ever rebuilt for a real developer: replace the content in `src/data/village.js`, attach the
form to a real endpoint, publish the privacy notice, and display the project's License to Sell.
