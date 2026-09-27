/* ============================================================
   St. Joseph Village — content + pricing model

   EVERYTHING in this file is illustrative. The developer, the prices,
   the lot inventory and the availability are invented for a design
   demonstration. See DISCLAIMER below — it is rendered in the footer
   and must stay there.
   ============================================================ */

export const VILLAGE = {
  name: "St. Joseph Village",
  patron: "St. Joseph",
  developer: "Ilaya Land & Homes, Inc.",
  tagline: "A gated residential village in San Pedro, Laguna.",
  location: {
    barangay: "Langgam",
    city: "San Pedro",
    province: "Laguna",
    region: "CALABARZON",
    coordinates: { lat: 14.3585, lng: 121.0567 },
  },
  scale: {
    hectares: 24,
    phases: 6,
    homes: 1180,
    density: "R-1 low density · 60% open space",
  },
};

/* Distance / drive-time claims are typical South Luzon figures for the
   San Pedro stretch of Laguna and are part of the illustration, not a
   survey. */
export const CONNECTIONS = [
  { place: "Alabang Town Center", km: 16, minutes: 25, note: "via SLEX" },
  { place: "Makati CBD", km: 33, minutes: 50, note: "via SLEX / Skyway" },
  { place: "SM Center San Pedro", km: 3, minutes: 8, note: "via National Hwy" },
  { place: "De La Salle University – Laguna", km: 8, minutes: 16, note: "via SLEX, Biñan" },
  { place: "San Pedro City Hall", km: 2.5, minutes: 7, note: "via National Hwy" },
  { place: "NAIA Terminal 3", km: 28, minutes: 45, note: "via Skyway" },
];

/* ---- House models ------------------------------------------------
   Prices sit inside the South Luzon mid-market band for a house-and-lot
   in a gated subdivision, which is exactly what a concept build should show.
------------------------------------------------------------------- */
export const MODELS = [
  {
    id: "aralia",
    name: "Aralia",
    kind: "Townhouse",
    lot: 60,
    floor: 46,
    beds: 2,
    baths: 1,
    price: 2_950_000,
    blurb: "The starter home — a compact two-storey townhouse with its own carport.",
    features: ["Corner-less inner unit", "Provision for 2nd floor", "Own carport", "RFO"],
  },
  {
    id: "ilang-ilang",
    name: "Ilang-Ilang",
    kind: "Single detached",
    lot: 100,
    floor: 62,
    beds: 3,
    baths: 2,
    price: 4_180_000,
    blurb: "A modest single-detached on a 100 sqm lot — the easiest model to grow into.",
    features: ["Single detached", "Carport + service area", "Powder room", "RFO"],
  },
  {
    id: "sampaguita",
    name: "Sampaguita",
    kind: "Single detached",
    lot: 120,
    floor: 84,
    beds: 3,
    baths: 2,
    price: 5_650_000,
    blurb: "Our most requested model — a three-bedroom with a family area upstairs.",
    features: ["Family area", "Maid's / utility room", "2-car carport", "Pre-selling"],
    featured: true,
  },
  {
    id: "narra",
    name: "Narra",
    kind: "Single detached",
    lot: 150,
    floor: 110,
    beds: 4,
    baths: 3,
    price: 7_240_000,
    blurb: "A wide-frontage home with a ground-floor bedroom for elders or guests.",
    features: ["Ground-floor bedroom", "Study nook", "Lanai", "Pre-selling"],
  },
  {
    id: "molave",
    name: "Molave",
    kind: "Premium",
    lot: 200,
    floor: 140,
    beds: 4,
    baths: 3,
    price: 9_850_000,
    blurb: "The premium corner model, on the widest lots on the ridge side of the village.",
    features: ["Corner / ridge lots", "Two-storey foyer", "Covered lanai", "Limited inventory"],
  },
];

/* ---- Lot-only inventory ------------------------------------------ */
export const LOT_PRICING = {
  perSqm: 16_500,
  cornerPremiumPct: 12,
  minimumArea: 120,
  lotSizes: [120, 150, 180, 200, 250, 300],
};

/* ---- Amenities ---------------------------------------------------- */
export const AMENITIES = [
  {
    id: "chapel",
    name: "St. Joseph Chapel",
    icon: "chapel",
    desc: "A 180-seat village chapel at the heart of the plan, with weekly masses and a covered patio for baptisms and weddings.",
    hero: true,
  },
  { id: "clubhouse", name: "Clubhouse & Function Hall", icon: "hall", desc: "A 240-guest function hall, multi-purpose room and covered walkway for village assemblies." },
  { id: "court", name: "Covered Basketball Court", icon: "court", desc: "A full-size court under roof, with markings for volleyball and badminton." },
  { id: "playground", name: "Children's Playground", icon: "play", desc: "Rubberised play surface, swings and a shaded seating deck for parents." },
  { id: "parks", name: "Pocket Parks & Jogging Path", icon: "park", desc: "A 1.2 km jogging loop threaded between six pocket parks and a linear garden." },
  { id: "gate", name: "Gated Entrance & 24-Hour Security", icon: "shield", desc: "Guarded main gate, resident and visitor lane separation, CCTV on the perimeter fencing." },
  { id: "drainage", name: "Underground Drainage", icon: "water", desc: "Reinforced concrete box culverts, individual septic vaults and a retention pond on the west phase." },
  { id: "utilities", name: "Meralco Power & Water Supply", icon: "bolt", desc: "Underground primary lines, Meralco service, deep well and overhead tank with utility connection." },
];

/* ---- Financing ----------------------------------------------------
   Indicative rates. Real quotes depend on the bank, the borrower and the
   prevailing policy rate, and are re-priced yearly on repricing schemes.
------------------------------------------------------------------- */
export const SCHEMES = {
  pagibig: {
    id: "pagibig",
    label: "Pag-IBIG Fund",
    rate: 6.5,
    maxYears: 30,
    defaultYears: 30,
    note: "Lowest rate, longest tenor. Loanable amount is subject to the fund's ceiling and your contribution record.",
  },
  bank: {
    id: "bank",
    label: "Bank financing",
    rate: 8.5,
    maxYears: 20,
    defaultYears: 20,
    note: "Faster approval. Rates are typically fixed for the first 1–5 years, then repriced.",
  },
  inhouse: {
    id: "inhouse",
    label: "In-house financing",
    rate: 14,
    maxYears: 15,
    defaultYears: 10,
    note: "No bank approval needed. Highest rate, so it suits a short term or a bridge while a bank loan is processed.",
  },
};

export const PAYMENT_TERMS = {
  reservationFee: 20_000,
  dpOptions: [10, 15, 20, 30],
  defaultDpPct: 15,
  dpMonths: [12, 18, 24],
  defaultDpMonths: 18,
  miscFeePct: 5, // payable on turnover: taxes, registration, transfer, doc stamps
};

/* ---- Inventory for the site plan ---------------------------------
   A 24-hectare plan reduced to a readable 6-phase matrix. Status is
   illustrative; "reserved" and "sold" exist so the interaction has
   something real to show.
------------------------------------------------------------------- */
export const BLOCKS = [
  { phase: 1, lots: 12, status: "sold" },
  { phase: 2, lots: 12, status: "mixed" },
  { phase: 3, lots: 12, status: "available" },
  { phase: 4, lots: 12, status: "available" },
  { phase: 5, lots: 10, status: "preselling" },
  { phase: 6, lots: 10, status: "preselling" },
];

/* ---- FAQ ---------------------------------------------------------- */
export const FAQS = [
  {
    q: "Is this a real subdivision?",
    a: "No — and the page says so. St. Joseph Village, Ilaya Land & Homes, the prices and the lot inventory are invented for a design demonstration. Nothing here is an offer to sell.",
  },
  {
    q: "What is covered by the reservation fee?",
    a: "It is deducted from your downpayment, not added on top of it. In this model the fee is ₱20,000, and it is the only payment required to hold a lot while your downpayment schedule starts.",
  },
  {
    q: "Can I buy the lot only?",
    a: "Yes. Construction is optional on most lots, though the deed of restrictions sets a minimum floor area and a build-out window so the village fills in consistently.",
  },
  {
    q: "What are miscellaneous fees?",
    a: "Roughly 5% of the contract price, payable at turnover. That covers transfer taxes, registration, documentary stamp tax and the usual processing — budget for it, because it is not part of the monthly amortisation.",
  },
  {
    q: "How long does turnover take?",
    a: "Ready-for-occupancy (RFO) units are handed over within weeks of full downpayment. Pre-selling units run on a construction schedule, typically 18 to 30 months from reservation.",
  },
  {
    q: "What happens to my personal data?",
    a: "This demo form does not transmit anything — it is a local interaction only. A real deployment must show a privacy notice and collect explicit consent under RA 10173, which is why the checkbox exists.",
  },
];

/* ---- Legal --------------------------------------------------------
   Keep this rendered. It is the whole reason the build can be honest.
------------------------------------------------------------------- */
export const DISCLAIMER = {
  badge: "Concept build",
  short: "Design demonstration — not a real listing.",
  long: [
    "This is a design and development demonstration. St. Joseph Village, the developer name, the house models, the prices, the lot inventory and the availability shown on this page are invented for the purpose of illustrating a landing page and are not an offer to sell, a reservation, or a representation of any existing project.",
    "No license to sell is claimed or implied for this page. A real subdivision project in the Philippines may only be advertised or sold with a License to Sell issued by the Department of Human Settlements and Urban Development (DHSUD) under PD 957, and any genuine listing would be required to display it.",
    "Nothing on this page is a quotation. Financing figures are indicative arithmetic only and are not an offer of credit; Pag-IBIG and bank terms are set by the lending institution and change with policy rates.",
    "The inquiry form on this page does not send, store, or transmit any information. A production version collecting a name, mobile number and email would need a published privacy notice and explicit consent under the Data Privacy Act of 2012 (RA 10173).",
  ],
};

export const CONTACT = {
  salesPhone: "+63 917 000 0000 (illustrative)",
  salesEmail: "sales@example.com (illustrative)",
  officeHours: "Mon–Sat · 9:00 AM – 5:00 PM",
  office: "On-site sales office, Brgy. Langgam, San Pedro, Laguna (illustrative)",
};

export const peso = (n, opts = {}) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
    ...opts,
  }).format(Math.round(n || 0));
