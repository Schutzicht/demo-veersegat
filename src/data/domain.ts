// ───────────────────────────────────────────────────────────────────────────
// Het Veerse Gat — domeinmodel
// Pure, SSR-veilige data + types + helpers. Geen localStorage hier (zie store.ts).
// Gemodelleerd op het kennismakingsgesprek met Karen (eigenaar):
//  · zeilkampen per boot-type en week (intern / extern / extern-min)
//  · capaciteit per klas, sommige boten max ~9 kinderen, "pak dicht" bij vol
//  · per kind: leeftijd, lengte, gewicht, behaalde + gewenste diploma's
//  · automatische signalen (te groot voor de Optimist → door naar de Pico)
//  · verblijf: 1 appartement, 3 luxe huisjes, 5 basis trekkershutten
//  · bootverhuur (Float-stijl) en groepen
// ───────────────────────────────────────────────────────────────────────────

export type DiplomaLevel = 0 | 1 | 2 | 3; // 0 = nog geen, 1/2/3 = CWO Zeilen I/II/III
export type Verblijfsvorm = "intern" | "extern" | "extern-min";

// ─── Boot-types ──────────────────────────────────────────────────────────────
export interface BoatType {
  key: string;
  label: string;
  blurb: string;
  ageMin: number;
  ageMax: number;
  /** Richtlijn maximale lengte (cm). Eroverheen → systeem seint "te groot". */
  lengthMaxCm: number;
  /** Richtlijn maximaal gewicht (kg). */
  weightMaxKg: number;
  cwoMin: DiplomaLevel;
  cwoMax: DiplomaLevel;
  /** Standaard aantal plekken per week voor dit boot-type. */
  capacityPerWeek: number;
  /** Naar welk boot-type schuif je door als een kind ontgroeit. */
  nextUp: string | null;
  crew: string;
  /** Eenvoudige SVG-zeilvorm voor de iconografie. */
  sailPath: string;
}

export const boats: BoatType[] = [
  {
    key: "optimist",
    label: "Optimist",
    blurb:
      "Het standaardschip om mee te beginnen. Eerst spelen op het strand, dan zeilen, dan racen. Elke Nederlandse zeil-cv start hier.",
    ageMin: 6,
    ageMax: 11,
    lengthMaxCm: 150,
    weightMaxKg: 45,
    cwoMin: 0,
    cwoMax: 2,
    capacityPerWeek: 12,
    nextUp: "pico",
    crew: "1 zeiler",
    sailPath: "M30 14 V58 L14 58 Z",
  },
  {
    key: "pico",
    label: "Laser Pico",
    blurb:
      "Lichte open jol, sneller en reactiever dan de Optimist. Voor wie al wat ervaring heeft, of voor wie de Optimist is ontgroeid.",
    ageMin: 10,
    ageMax: 15,
    lengthMaxCm: 185,
    weightMaxKg: 75,
    cwoMin: 1,
    cwoMax: 3,
    capacityPerWeek: 9, // de "max negen kinderen"-boot uit het gesprek
    nextUp: "bahia",
    crew: "1 – 2 zeilers",
    sailPath: "M30 12 V58 L14 58 Z",
  },
  {
    key: "bahia",
    label: "Bahia",
    blurb:
      "Kielboot voor twee, met spinnaker. De stap naar groter werk: samen varen, taken verdelen, leren overstag in de wind.",
    ageMin: 13,
    ageMax: 18,
    lengthMaxCm: 200,
    weightMaxKg: 95,
    cwoMin: 1,
    cwoMax: 3,
    capacityPerWeek: 8,
    nextUp: "valk",
    crew: "2 zeilers",
    sailPath: "M30 16 V58 L14 58 Z M32 20 V58 L46 58 Z",
  },
  {
    key: "valk",
    label: "Valk",
    blurb:
      "Klassieke houten kielboot. Voor volwassen beginners én voor wie eindelijk z'n CWO-diploma wil halen, in een week of een weekend.",
    ageMin: 15,
    ageMax: 99,
    lengthMaxCm: 210,
    weightMaxKg: 110,
    cwoMin: 0,
    cwoMax: 3,
    capacityPerWeek: 8,
    nextUp: null,
    crew: "2 – 4 zeilers",
    sailPath: "M30 18 V58 L12 58 Z",
  },
  {
    key: "allround",
    label: "Allround",
    blurb:
      "Herfstweek waar we boten en niveaus mixen. Voor wie al kan zeilen en wil bijschaven, of voor jongere zeilers die door willen groeien.",
    ageMin: 9,
    ageMax: 16,
    lengthMaxCm: 185,
    weightMaxKg: 80,
    cwoMin: 1,
    cwoMax: 3,
    capacityPerWeek: 14,
    nextUp: null,
    crew: "Optimist & Laser",
    sailPath: "M22 18 V58 L8 58 Z M34 22 V58 L52 58 Z",
  },
];

export const boatByKey = (key: string): BoatType | undefined =>
  boats.find((b) => b.key === key);

// ─── Weken ───────────────────────────────────────────────────────────────────
export type WeekKind = "zomer" | "herfst" | "weekend";

export interface Week {
  id: string;
  /** Weeknummer of label, bv. "Week 28" of "Weekend". */
  label: string;
  kind: WeekKind;
  startDate: string; // ISO
  endDate: string;
  schedule: string;
  /** Boot-types die deze week draaien. */
  boats: string[];
}

export const weeks: Week[] = [
  { id: "w27", label: "Week 27", kind: "zomer", startDate: "2026-06-29", endDate: "2026-07-03", schedule: "ma t/m vr · 09:30 – 16:00", boats: ["optimist", "pico", "bahia"] },
  { id: "w28", label: "Week 28", kind: "zomer", startDate: "2026-07-06", endDate: "2026-07-10", schedule: "ma t/m vr · 09:30 – 16:00", boats: ["optimist", "pico", "bahia"] },
  { id: "w29", label: "Week 29", kind: "zomer", startDate: "2026-07-13", endDate: "2026-07-17", schedule: "ma t/m vr · 09:30 – 16:00", boats: ["optimist", "pico", "bahia"] },
  { id: "w30", label: "Week 30", kind: "zomer", startDate: "2026-07-20", endDate: "2026-07-24", schedule: "ma t/m vr · 09:30 – 16:30", boats: ["optimist", "pico", "bahia", "valk"] },
  { id: "w31", label: "Week 31", kind: "zomer", startDate: "2026-07-27", endDate: "2026-07-31", schedule: "ma t/m vr · 09:30 – 16:30", boats: ["optimist", "pico", "bahia", "valk"] },
  { id: "w32", label: "Week 32", kind: "zomer", startDate: "2026-08-03", endDate: "2026-08-07", schedule: "ma t/m vr · 09:30 – 16:30", boats: ["optimist", "pico", "bahia", "valk"] },
  { id: "w33", label: "Week 33", kind: "zomer", startDate: "2026-08-10", endDate: "2026-08-14", schedule: "ma t/m vr · 09:30 – 16:00", boats: ["optimist", "pico", "bahia"] },
  { id: "w34", label: "Week 34", kind: "zomer", startDate: "2026-08-17", endDate: "2026-08-21", schedule: "ma t/m vr · 09:30 – 16:00", boats: ["optimist", "pico", "bahia"] },
  { id: "herfst", label: "Herfstweek", kind: "herfst", startDate: "2026-10-19", endDate: "2026-10-23", schedule: "ma t/m vr · 09:30 – 15:30", boats: ["allround"] },
  { id: "we-mei", label: "Weekend mei", kind: "weekend", startDate: "2026-05-16", endDate: "2026-05-17", schedule: "za + zo · 10:00 – 16:00", boats: ["valk"] },
  { id: "we-jun", label: "Weekend juni", kind: "weekend", startDate: "2026-06-13", endDate: "2026-06-14", schedule: "za + zo · 10:00 – 16:00", boats: ["bahia"] },
];

export const weekById = (id: string): Week | undefined =>
  weeks.find((w) => w.id === id);

// ─── Klassen (week × boot) — de boekbare eenheid van een zeilkamp ─────────────
export interface Klas {
  id: string;
  weekId: string;
  boat: string;
  capacity: number;
  /** Basisbezetting (terugkerende gasten die al vastliggen) zodat de demo leeft. */
  baseline: number;
  price: number;
}

// Prijs per boot-type (per week). Weekend = lager.
const weekPrice: Record<string, number> = {
  optimist: 295,
  pico: 325,
  bahia: 365,
  valk: 425,
  allround: 295,
};

// Realistische basisbezetting per klas (0–100% van capaciteit). Geeft de demo
// het gevoel van een seizoen dat al loopt: sommige weken bijna vol, andere rustig.
const baselinePct: Record<string, number> = {
  // populaire midzomer-weken vol, randen rustiger
  "w27-optimist": 0.5, "w27-pico": 0.55, "w27-bahia": 0.5,
  "w28-optimist": 0.83, "w28-pico": 0.66, "w28-bahia": 0.62,
  "w29-optimist": 1.0, "w29-pico": 1.0, "w29-bahia": 0.75,
  "w30-optimist": 0.91, "w30-pico": 0.88, "w30-bahia": 0.62, "w30-valk": 0.62,
  "w31-optimist": 0.83, "w31-pico": 0.77, "w31-bahia": 0.5, "w31-valk": 0.5,
  "w32-optimist": 0.66, "w32-pico": 0.55, "w32-bahia": 0.5, "w32-valk": 0.37,
  "w33-optimist": 0.5, "w33-pico": 0.44, "w33-bahia": 0.37,
  "w34-optimist": 0.41, "w34-pico": 0.33, "w34-bahia": 0.25,
  "herfst-allround": 0.28,
  "we-mei-valk": 0.5,
  "we-jun-bahia": 0.7,
};

export const klassen: Klas[] = weeks.flatMap((w) =>
  w.boats.map((boatKey) => {
    const boat = boatByKey(boatKey)!;
    const id = `${w.id}-${boatKey}`;
    const capacity =
      w.kind === "weekend" ? Math.min(8, boat.capacityPerWeek) : boat.capacityPerWeek;
    const pct = baselinePct[id] ?? 0.4;
    return {
      id,
      weekId: w.id,
      boat: boatKey,
      capacity,
      baseline: Math.min(capacity, Math.round(capacity * pct)),
      price: w.kind === "weekend" ? weekPrice[boatKey] - 80 : weekPrice[boatKey],
    };
  })
);

export const klasById = (id: string): Klas | undefined =>
  klassen.find((k) => k.id === id);

// ─── Verblijf ────────────────────────────────────────────────────────────────
export interface StayType {
  key: string;
  label: string;
  tagline: string;
  body: string;
  units: number; // aantal beschikbare eenheden
  sleeps: string;
  unit: "nacht" | "2 nachten" | "week";
  priceFrom: number;
  season: string;
  features: string[];
  photo: string;
}

export const stays: StayType[] = [
  {
    key: "basis",
    label: "Basis trekkershut",
    tagline: "Vijf hutten · per twee nachten",
    body:
      "Eenvoudige houten hutten met stapelbedden. Koelkast, dekens, alles is er, je neemt zelf je potten en pannen mee. Per twee nachten, het hele seizoen, ook in het hoogseizoen.",
    units: 5,
    sleeps: "tot 6 personen",
    unit: "2 nachten",
    priceFrom: 79,
    season: "Pasen t/m oktober",
    features: ["Stapelbedden", "Gedeeld sanitair", "Eigen koelkast", "Min. 2 nachten"],
    photo: "/photos/trekkershut.jpg",
  },
  {
    key: "luxe",
    label: "Luxe huisje",
    tagline: "Drie huisjes · per week",
    body:
      "Geïsoleerd, met stromend water en een eigen badkamer, geen stapelbedden. Terras met de zon mee, uitzicht op het veld. Het hele jaar door, tot het echt vriest.",
    units: 3,
    sleeps: "4 personen",
    unit: "week",
    priceFrom: 545,
    season: "Hele jaar (tot −5°C)",
    features: ["Stromend water", "Eigen badkamer", "Geïsoleerd", "Terras op de zon"],
    photo: "/photos/luxe-huisje.jpg",
  },
  {
    key: "appartement",
    label: "Het zeilappartement",
    tagline: "Eén appartement · per nacht",
    body:
      "Boven de loods, met balkon, eigen keukentje en uitzicht over het meer. Twee slaapkamers, slaapt zes personen comfortabel. Inclusief televisie, de rest van het terrein heeft die bewust niet.",
    units: 1,
    sleeps: "6 personen",
    unit: "nacht",
    priceFrom: 145,
    season: "Hele jaar",
    features: ["Eigen keuken", "Balkon", "Televisie", "Uitzicht op het meer"],
    photo: "/photos/appartement.jpg",
  },
];

export const stayByKey = (key: string): StayType | undefined =>
  stays.find((s) => s.key === key);

// ─── Bootverhuur (Float-stijl: per dag aftellen) ──────────────────────────────
export interface RentalBoat {
  key: string;
  label: string;
  desc: string;
  persons: string;
  pricePerDay: number;
  /** Aantal exemplaren in de verhuurvloot. */
  fleet: number;
  needsDiploma: boolean;
  photo: string | null;
  accent: string;
}

export const rentals: RentalBoat[] = [
  {
    key: "valk",
    label: "Valk",
    desc: "Klassieke houten kielboot voor twee tot vier. Goed bestuurbaar, vergevingsgezind, een mooie lange historie.",
    persons: "2 – 4",
    pricePerDay: 95,
    fleet: 3,
    needsDiploma: true,
    photo: null,
    accent: "var(--color-tide)",
  },
  {
    key: "pico",
    label: "Laser Pico",
    desc: "Lichte open jol voor één of twee zeilers. Reageert snel, doet wat de wind doet.",
    persons: "1 – 2",
    pricePerDay: 65,
    fleet: 4,
    needsDiploma: true,
    photo: "/photos/slider-laser.jpg",
    accent: "var(--color-signal)",
  },
  {
    key: "optimist",
    label: "Optimist",
    desc: "Het standaardschip voor de jongste zeilers. Met een Optimist begint elke Nederlandse zeil-cv.",
    persons: "1",
    pricePerDay: 45,
    fleet: 6,
    needsDiploma: true,
    photo: "/photos/slider-kids.jpg",
    accent: "var(--color-rope)",
  },
  {
    key: "sloep",
    label: "Sloep (elektrisch)",
    desc: "Voor wie het water op wil zonder zeilkennis: een rustige rondvaart-sloep met elektrische motor.",
    persons: "tot 7",
    pricePerDay: 175,
    fleet: 2,
    needsDiploma: false,
    photo: null,
    accent: "var(--color-foam)",
  },
];

export const rentalByKey = (key: string): RentalBoat | undefined =>
  rentals.find((r) => r.key === key);

// ─── Labels & formatters ─────────────────────────────────────────────────────
export const verblijfLabels: Record<Verblijfsvorm, string> = {
  intern: "Intern (slaapt op het terrein)",
  extern: "Extern (komt elke dag)",
  "extern-min": "Extern-min (komt, eet mee, blijft niet slapen)",
};

export const verblijfShort: Record<Verblijfsvorm, string> = {
  intern: "Intern",
  extern: "Extern",
  "extern-min": "Extern-min",
};

export const diplomaLabel = (d: DiplomaLevel): string =>
  d === 0 ? "Nog geen" : `CWO ${["", "I", "II", "III"][d]}`;

export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameMonth = start.getMonth() === end.getMonth();
  const monthLong = end.toLocaleDateString("nl-NL", { month: "long" });
  if (sameMonth) return `${start.getDate()} – ${end.getDate()} ${monthLong}`;
  const startMonth = start.toLocaleDateString("nl-NL", { month: "short" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${monthLong}`;
}

export function ageFromBirthdate(birthISO: string, refISO?: string): number {
  const b = new Date(birthISO);
  const ref = refISO ? new Date(refISO) : new Date();
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}

// ─── Signalen / mismatch-detectie ─────────────────────────────────────────────
// Precies Karens voorbeeld: een kind van tien dat te groot/zwaar is voor de
// Optimist moet eigenlijk door naar de Pico. Het systeem rekent, Karen beslist.
export type FlagSeverity = "actie" | "let-op" | "info";
export interface Flag {
  severity: FlagSeverity;
  message: string;
}

export interface FlagInput {
  boat: string;
  /** Leeftijd op de startdatum van de week. */
  age: number;
  lengthCm: number;
  weightKg: number;
  huidigDiploma: DiplomaLevel;
  doelDiploma: DiplomaLevel;
  verblijf: Verblijfsvorm;
  dieet?: string;
  medicijnen?: string;
  kamergenoot?: string;
  komtAlleen?: boolean;
}

export function computeFlags(input: FlagInput): Flag[] {
  const flags: Flag[] = [];
  const boat = boatByKey(input.boat);
  if (!boat) return flags;

  const next = boat.nextUp ? boatByKey(boat.nextUp) : null;

  // Te groot / te zwaar voor het boot-type → doorschuiven
  const overLength = input.lengthCm > boat.lengthMaxCm;
  const overWeight = input.weightKg > boat.weightMaxKg;
  if ((overLength || overWeight) && next) {
    const reason = overLength && overWeight ? "lengte en gewicht" : overLength ? "lengte" : "gewicht";
    flags.push({
      severity: "actie",
      message: `Qua ${reason} groot voor de ${boat.label}. Overweeg door te schuiven naar de ${next.label}.`,
    });
  }

  // Leeftijd buiten de bandbreedte van het boot-type
  if (input.age < boat.ageMin) {
    flags.push({
      severity: "let-op",
      message: `${input.age} jaar is jong voor de ${boat.label} (vanaf ${boat.ageMin}). Even bellen met de ouders.`,
    });
  } else if (input.age > boat.ageMax) {
    const tip = next ? ` Misschien de ${next.label}?` : "";
    flags.push({
      severity: "let-op",
      message: `${input.age} jaar is aan de oude kant voor de ${boat.label} (t/m ${boat.ageMax}).${tip}`,
    });
  }

  // Diploma-doel niet hoger dan het al behaalde niveau
  if (input.doelDiploma <= input.huidigDiploma && input.doelDiploma > 0) {
    flags.push({
      severity: "let-op",
      message: `Gaat voor ${diplomaLabel(input.doelDiploma)} maar heeft dat al. Doel checken.`,
    });
  }
  // Te grote sprong in diploma's
  if (input.doelDiploma - input.huidigDiploma >= 3) {
    flags.push({
      severity: "info",
      message: "Grote sprong in diploma-doel; haalbaarheid in één week bespreken.",
    });
  }

  // Medisch / dieet
  if (input.medicijnen && input.medicijnen.trim()) {
    flags.push({ severity: "let-op", message: `Medicijnen: ${input.medicijnen.trim()}.` });
  }
  if (input.dieet && input.dieet.trim()) {
    flags.push({ severity: "info", message: `Dieet/allergie: ${input.dieet.trim()}.` });
  }

  // Komt alleen → niet bij een gesettelde groep mixen
  if (input.komtAlleen) {
    flags.push({
      severity: "info",
      message: "Komt alleen. Niet ongemerkt bij een vaste vriendengroep indelen.",
    });
  }

  // Kamergenoot-wens (alleen relevant bij intern)
  if (input.verblijf === "intern" && input.kamergenoot && input.kamergenoot.trim()) {
    flags.push({
      severity: "info",
      message: `Wil graag op de kamer bij ${input.kamergenoot.trim()}.`,
    });
  }

  return flags;
}
