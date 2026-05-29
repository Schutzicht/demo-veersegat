// ───────────────────────────────────────────────────────────────────────────
// Het Veerse Gat — store (demo-backend op localStorage)
// Dit is wat in productie een database + API zou zijn. De schermen blijven gelijk.
// Eén bron van waarheid voor de publieke inschrijf-flow én de beheerkant; beide
// luisteren naar hetzelfde change-event zodat een wijziging meteen overal landt.
// ───────────────────────────────────────────────────────────────────────────

import {
  klassen, klasById, boatByKey, weekById, computeFlags, ageFromBirthdate,
  type DiplomaLevel, type Verblijfsvorm, type Flag,
} from "./domain";
import { voornamenK, achternamen, plaatsen, dieetVoorbeelden, medicijnVoorbeelden } from "./names";

// ─── Types ───────────────────────────────────────────────────────────────────
export type RegStatus = "nieuw" | "bevestigd" | "wachtlijst" | "geannuleerd";

export interface Registration {
  id: string;
  ref: string;
  klasId: string;
  voornaam: string;
  achternaam: string;
  birthdate: string; // ISO
  lengthCm: number;
  weightKg: number;
  verblijf: Verblijfsvorm;
  huidigDiploma: DiplomaLevel;
  doelDiploma: DiplomaLevel;
  ouderNaam: string;
  email: string;
  telefoon: string;
  plaats: string;
  dieet: string;
  medicijnen: string;
  kamergenoot: string;
  komtAlleen: boolean;
  status: RegStatus;
  returning: boolean;
  ts: number;
}

export type BookingKind = "verblijf" | "boot" | "groep";
export interface Booking {
  id: string;
  ref: string;
  kind: BookingKind;
  productKey: string;
  productLabel: string;
  naam: string;
  email: string;
  telefoon: string;
  date: string; // ISO
  qty: number; // nachten / dagen / personen
  qtyUnit: string;
  note: string;
  status: "nieuw" | "bevestigd" | "geannuleerd";
  ts: number;
}

export interface KlasOverride {
  closed?: boolean;
  capacity?: number;
}
export type OverridesMap = Record<string, KlasOverride>;

export interface Settings {
  inschrijvingenOpen: boolean;
}

// ─── Keys ────────────────────────────────────────────────────────────────────
const K = {
  regs: "vg2-registrations",
  bookings: "vg2-bookings",
  overrides: "vg2-overrides",
  settings: "vg2-settings",
  seeded: "vg2-seeded-v3",
};

const CHANGE_EVENT = "vg-store-changed";

// ─── Lage-niveau IO ──────────────────────────────────────────────────────────
const hasLS = (): boolean => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

function read<T>(key: string, fallback: T): T {
  if (!hasLS()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, val: unknown): void {
  if (!hasLS()) return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* localStorage vol of uit; demo werkt zonder persistentie */
  }
}

/** Laat publieke site + beheer in dezelfde tab reageren. (storage-event dekt andere tabs.) */
export function notify(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  }
}
export function onChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

// ─── Getters ─────────────────────────────────────────────────────────────────
export const getRegistrations = (): Registration[] => read<Registration[]>(K.regs, []);
export const getBookings = (): Booking[] => read<Booking[]>(K.bookings, []);
export const getOverrides = (): OverridesMap => read<OverridesMap>(K.overrides, {});
export const getSettings = (): Settings => read<Settings>(K.settings, { inschrijvingenOpen: true });

const setRegistrations = (r: Registration[]) => write(K.regs, r);
const setBookings = (b: Booking[]) => write(K.bookings, b);
const setOverrides = (o: OverridesMap) => write(K.overrides, o);

// ─── Afgeleide bezetting per klas ─────────────────────────────────────────────
export interface KlasState {
  klasId: string;
  capacity: number;
  /** Inschrijvingen die een plek bezetten (nieuw + bevestigd). */
  active: number;
  booked: number; // = active; elke bezette plek is een echte inschrijving
  remaining: number;
  closed: boolean;
  full: boolean;
  waitlist: number;
  pct: number;
}

export function klasState(klasId: string, regs?: Registration[]): KlasState {
  const klas = klasById(klasId);
  const ov = getOverrides()[klasId] ?? {};
  const all = regs ?? getRegistrations();
  const capacity = ov.capacity ?? klas?.capacity ?? 0;
  const forKlas = all.filter((r) => r.klasId === klasId);
  const active = forKlas.filter((r) => r.status === "nieuw" || r.status === "bevestigd").length;
  const waitlist = forKlas.filter((r) => r.status === "wachtlijst").length;
  const closed = !!ov.closed;
  const booked = active;
  const remaining = closed ? 0 : Math.max(0, capacity - booked);
  const full = !closed && remaining === 0;
  const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
  return { klasId, capacity, active, booked, remaining, closed, full, waitlist, pct };
}

export interface Totals {
  inschrijvingen: number; // niet-geannuleerd
  bevestigd: number;
  nieuw: number;
  wachtlijst: number;
  flagsActie: number;
  vrijeplekken: number;
  capaciteit: number;
  bezet: number;
  bezettingPct: number;
}

export function totals(): Totals {
  const regs = getRegistrations();
  const niet = regs.filter((r) => r.status !== "geannuleerd");
  let vrij = 0, cap = 0, bezet = 0;
  for (const k of klassen) {
    const st = klasState(k.id, regs);
    if (!st.closed) vrij += st.remaining;
    cap += st.capacity;
    bezet += st.booked;
  }
  const flagsActie = niet
    .filter((r) => r.status === "nieuw")
    .reduce((acc, r) => acc + (flagsFor(r).some((f) => f.severity === "actie") ? 1 : 0), 0);
  return {
    inschrijvingen: niet.length,
    bevestigd: regs.filter((r) => r.status === "bevestigd").length,
    nieuw: regs.filter((r) => r.status === "nieuw").length,
    wachtlijst: regs.filter((r) => r.status === "wachtlijst").length,
    flagsActie,
    vrijeplekken: vrij,
    capaciteit: cap,
    bezet,
    bezettingPct: cap > 0 ? Math.round((bezet / cap) * 100) : 0,
  };
}

// ─── Signalen voor een inschrijving ───────────────────────────────────────────
export function flagsFor(reg: Registration): Flag[] {
  const klas = klasById(reg.klasId);
  const week = klas ? weekById(klas.weekId) : undefined;
  if (!klas || !week) return [];
  const age = ageFromBirthdate(reg.birthdate, week.startDate);
  return computeFlags({
    boat: klas.boat,
    age,
    lengthCm: reg.lengthCm,
    weightKg: reg.weightKg,
    huidigDiploma: reg.huidigDiploma,
    doelDiploma: reg.doelDiploma,
    verblijf: reg.verblijf,
    dieet: reg.dieet,
    medicijnen: reg.medicijnen,
    kamergenoot: reg.kamergenoot,
    komtAlleen: reg.komtAlleen,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad = (n: number, len = 4) => String(n).padStart(len, "0");
function nextRef(seq: number): string {
  return `VG26-${pad(seq)}`;
}
function genId(prefix: string, seq: number): string {
  return `${prefix}-${seq}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Inschrijven (publieke flow) ──────────────────────────────────────────────
export interface SubmitInput {
  klasId: string;
  voornaam: string;
  achternaam: string;
  birthdate: string;
  lengthCm: number;
  weightKg: number;
  verblijf: Verblijfsvorm;
  huidigDiploma: DiplomaLevel;
  doelDiploma: DiplomaLevel;
  ouderNaam: string;
  email: string;
  telefoon: string;
  plaats?: string;
  dieet?: string;
  medicijnen?: string;
  kamergenoot?: string;
  komtAlleen?: boolean;
}

export interface SubmitResult {
  registration: Registration;
  waitlisted: boolean;
  flags: Flag[];
}

export function submitRegistration(input: SubmitInput): SubmitResult {
  const regs = getRegistrations();
  const st = klasState(input.klasId, regs);
  const waitlisted = st.full || st.closed; // "pak dicht": geen plek meer → wachtlijst
  const seq = regs.length + 1;
  const reg: Registration = {
    id: genId("reg", seq),
    ref: nextRef(seq),
    klasId: input.klasId,
    voornaam: input.voornaam.trim(),
    achternaam: input.achternaam.trim(),
    birthdate: input.birthdate,
    lengthCm: input.lengthCm,
    weightKg: input.weightKg,
    verblijf: input.verblijf,
    huidigDiploma: input.huidigDiploma,
    doelDiploma: input.doelDiploma,
    ouderNaam: input.ouderNaam.trim(),
    email: input.email.trim(),
    telefoon: input.telefoon.trim(),
    plaats: (input.plaats ?? "").trim(),
    dieet: (input.dieet ?? "").trim(),
    medicijnen: (input.medicijnen ?? "").trim(),
    kamergenoot: (input.kamergenoot ?? "").trim(),
    komtAlleen: !!input.komtAlleen,
    status: waitlisted ? "wachtlijst" : "nieuw",
    returning: false,
    ts: Date.now(),
  };
  regs.push(reg);
  setRegistrations(regs);
  notify();
  return { registration: reg, waitlisted, flags: flagsFor(reg) };
}

// ─── Beheer-mutaties ──────────────────────────────────────────────────────────
export function setRegStatus(id: string, status: RegStatus): void {
  const regs = getRegistrations();
  const reg = regs.find((r) => r.id === id);
  if (!reg) return;
  reg.status = status;
  setRegistrations(regs);
  notify();
}

/** Verplaats een inschrijving naar een andere klas (bv. Optimist → Pico). */
export function moveRegistration(id: string, newKlasId: string): boolean {
  const regs = getRegistrations();
  const reg = regs.find((r) => r.id === id);
  if (!reg || !klasById(newKlasId)) return false;
  reg.klasId = newKlasId;
  // Bij verplaatsen weer als "nieuw" markeren zodat Karen 'm opnieuw beoordeelt.
  if (reg.status === "wachtlijst") reg.status = "nieuw";
  setRegistrations(regs);
  notify();
  return true;
}

export function deleteRegistration(id: string): void {
  setRegistrations(getRegistrations().filter((r) => r.id !== id));
  notify();
}

export function toggleClosed(klasId: string, closed?: boolean): void {
  const ov = getOverrides();
  const cur = ov[klasId] ?? {};
  cur.closed = closed === undefined ? !cur.closed : closed;
  if (!cur.closed) delete cur.closed;
  if (Object.keys(cur).length) ov[klasId] = cur;
  else delete ov[klasId];
  setOverrides(ov);
  notify();
}

export function setCapacity(klasId: string, capacity: number): void {
  const ov = getOverrides();
  const cur = ov[klasId] ?? {};
  const def = klasById(klasId)?.capacity;
  if (capacity === def) delete cur.capacity;
  else cur.capacity = capacity;
  if (Object.keys(cur).length) ov[klasId] = cur;
  else delete ov[klasId];
  setOverrides(ov);
  notify();
}

// ─── Verhuur / verblijf / groepen ─────────────────────────────────────────────
export function addBooking(b: Omit<Booking, "id" | "ref" | "ts" | "status">): Booking {
  const bookings = getBookings();
  const seq = bookings.length + 1;
  const booking: Booking = {
    ...b,
    id: genId("bk", seq),
    ref: `VH26-${pad(seq)}`,
    status: "nieuw",
    ts: Date.now(),
  };
  bookings.push(booking);
  setBookings(bookings);
  notify();
  return booking;
}

// ─── Seed ────────────────────────────────────────────────────────────────────
// Deterministische PRNG zodat de demo elke keer dezelfde "geschiedenis" toont
// en publieke site + beheer altijd consistent zijn.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rng: () => number, arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (rng: () => number, lo: number, hi: number) => Math.round(lo + rng() * (hi - lo));

interface BuildOpts {
  status: RegStatus;
  forceFlag?: "tall" | "medisch" | "alleen" | "diploma" | null;
  returning?: boolean;
}

function buildRegistration(rng: () => number, klasId: string, seq: number, opts: BuildOpts): Registration {
  const klas = klasById(klasId)!;
  const week = weekById(klas.weekId)!;
  const boat = boatByKey(klas.boat)!;
  const voornaam = pick(rng, voornamenK);
  const achternaam = pick(rng, achternamen);
  // Leeftijd binnen de boot-bandbreedte (begrensd voor jeugd-boten)
  const ageHi = Math.min(boat.ageMax, boat.key === "valk" ? 52 : 17);
  let age = between(rng, boat.ageMin, ageHi);
  // Lengte/gewicht passend bij leeftijd
  let lengthCm = Math.min(boat.lengthMaxCm - 4, 95 + age * 6 + between(rng, -6, 6));
  let weightKg = Math.min(boat.weightMaxKg - 3, 14 + age * 3 + between(rng, -3, 4));
  let huidig = (Math.max(0, Math.min(boat.cwoMax - 1, Math.floor(rng() * (boat.cwoMax)))) as DiplomaLevel);
  let doel = (Math.min(3, huidig + 1) as DiplomaLevel);
  let medicijnen = "";
  let dieet = rng() < 0.18 ? pick(rng, dieetVoorbeelden) : "";
  let komtAlleen = rng() < 0.12;
  let kamergenoot = "";

  if (opts.forceFlag === "tall") {
    // Te groot/zwaar voor het boot-type → het systeem seint door naar nextUp
    age = Math.min(boat.ageMax, ageHi);
    lengthCm = boat.lengthMaxCm + between(rng, 6, 16);
    weightKg = boat.weightMaxKg + between(rng, 4, 12);
  } else if (opts.forceFlag === "medisch") {
    medicijnen = pick(rng, medicijnVoorbeelden);
  } else if (opts.forceFlag === "alleen") {
    komtAlleen = true;
  } else if (opts.forceFlag === "diploma") {
    huidig = 2;
    doel = 2; // gaat voor een diploma dat al behaald is
  }

  // Geboortedatum die de leeftijd op de startdatum oplevert
  const start = new Date(week.startDate);
  const birthYear = start.getFullYear() - age;
  const birthMonth = between(rng, 0, 10);
  const birthDay = between(rng, 1, 27);
  const birthdate = `${birthYear}-${pad(birthMonth + 1, 2)}-${pad(birthDay, 2)}`;

  const intern = week.kind === "weekend" ? false : rng() < 0.62;
  const verblijf: Verblijfsvorm = intern ? "intern" : rng() < 0.7 ? "extern" : "extern-min";
  if (verblijf === "intern" && rng() < 0.3) kamergenoot = pick(rng, voornamenK);

  const ouderNaam = `${pick(rng, ["Mark", "Petra", "Jeroen", "Esther", "Wouter", "Ingrid", "Bart", "Linda"])} ${achternaam}`;
  const plaats = pick(rng, plaatsen);
  const emailHandle = `${voornaam}.${achternaam}`.toLowerCase().replace(/[^a-z]/g, "");
  const email = `${emailHandle}@example.nl`;
  const telefoon = `06 ${between(rng, 10, 39)} ${between(rng, 100, 999)} ${between(rng, 10, 99)}`;

  return {
    id: genId("reg", seq),
    ref: nextRef(seq),
    klasId,
    voornaam,
    achternaam,
    birthdate,
    lengthCm: Math.round(lengthCm),
    weightKg: Math.round(weightKg),
    verblijf,
    huidigDiploma: huidig,
    doelDiploma: doel,
    ouderNaam,
    email,
    telefoon,
    plaats,
    dieet,
    medicijnen,
    kamergenoot,
    komtAlleen,
    status: opts.status,
    returning: opts.returning ?? rng() < 0.8, // ~80% terugkerende gasten
    ts: Date.now(),
  };
}

export function isSeeded(): boolean {
  return hasLS() && localStorage.getItem(K.seeded) === "1";
}

export function seed(force = false): void {
  if (!hasLS()) return;
  if (!force && isSeeded()) return;

  const rng = mulberry32(20260101); // 1 januari 2026
  const regs: Registration[] = [];
  let seq = 1;
  const now = Date.now();
  const day = 86400000;

  // 1) Bevestigde inschrijvingen om de basisbezetting te halen.
  for (const klas of klassen) {
    for (let i = 0; i < klas.baseline; i++) {
      const reg = buildRegistration(rng, klas.id, seq, { status: "bevestigd", returning: rng() < 0.82 });
      // Spreiding over de afgelopen maanden, met een piek rond 1 jan.
      reg.ts = now - between(rng, 4, 150) * day - between(rng, 0, 23) * 3600000;
      regs.push(reg);
      seq++;
    }
  }

  // 2) Een handvol "nieuw" (nog te verwerken) inschrijvingen met opzet-signalen,
  //    precies de gevallen die Karen handmatig zou nabellen.
  const newCases: { klasId: string; flag: BuildOpts["forceFlag"] }[] = [
    { klasId: "w28-optimist", flag: "tall" },     // te groot voor de Optimist → Pico
    { klasId: "w30-optimist", flag: "tall" },
    { klasId: "w31-pico", flag: "medisch" },
    { klasId: "w28-bahia", flag: "alleen" },
    { klasId: "w32-valk", flag: "diploma" },
    { klasId: "w33-optimist", flag: null },
    { klasId: "w34-pico", flag: null },
  ];
  for (const c of newCases) {
    const reg = buildRegistration(rng, c.klasId, seq, { status: "nieuw", forceFlag: c.flag });
    reg.ts = now - between(rng, 1, 20) * 3600000; // recent binnengekomen
    regs.push(reg);
    seq++;
  }

  // 3) Wachtlijst voor de volle weken (week 29 zit vol in de baseline).
  const waitKlassen = ["w29-optimist", "w29-pico", "w29-bahia", "w30-optimist"];
  for (const klasId of waitKlassen) {
    const count = between(rng, 1, 3);
    for (let i = 0; i < count; i++) {
      const reg = buildRegistration(rng, klasId, seq, { status: "wachtlijst" });
      reg.ts = now - between(rng, 1, 40) * day;
      regs.push(reg);
      seq++;
    }
  }

  setRegistrations(regs);

  // 4) Een paar verhuur-/verblijf-boekingen voor het overzicht.
  const bookings: Booking[] = [];
  const bk = (kind: BookingKind, productKey: string, productLabel: string, qty: number, qtyUnit: string, daysAgo: number) => {
    const s = bookings.length + 1;
    bookings.push({
      id: genId("bk", s), ref: `VH26-${pad(s)}`, kind, productKey, productLabel,
      naam: `${pick(rng, ["Familie", "Fam.", "Dhr.", "Mevr."])} ${pick(rng, achternamen)}`,
      email: "gast@example.nl", telefoon: `06 ${between(rng, 10, 39)} ${between(rng, 100, 999)} ${between(rng, 10, 99)}`,
      date: new Date(now + between(rng, 5, 60) * day).toISOString().slice(0, 10),
      qty, qtyUnit, note: "", status: rng() < 0.5 ? "bevestigd" : "nieuw", ts: now - daysAgo * day,
    });
  };
  bk("verblijf", "luxe", "Luxe huisje", 1, "week", 3);
  bk("verblijf", "basis", "Basis trekkershut", 2, "nachten", 1);
  bk("verblijf", "appartement", "Het zeilappartement", 3, "nachten", 5);
  bk("boot", "valk", "Valk (dag)", 1, "dag", 2);
  bk("boot", "sloep", "Sloep elektrisch", 1, "dag", 0);
  bk("groep", "kantine", "Groep + kantine", 18, "personen", 6);
  setBookings(bookings);

  localStorage.setItem(K.seeded, "1");
  notify();
}

// ─── 1 januari, 15:00 — de piek ──────────────────────────────────────────────
// Karen opent alles in één keer; ~60 inschrijvingen tikken in enkele minuten binnen.
// Deze functie voegt er per aanroep een paar toe, alsof ze net binnenkomen.
export function simulateRush(batch = 6): number {
  const regs = getRegistrations();
  const rng = mulberry32((Date.now() & 0xffff) + regs.length);
  // Kies open klassen met nog plek, gewogen naar de populaire weken.
  const open = klassen.filter((k) => {
    const st = klasState(k.id, regs);
    return !st.closed; // ook volle: dan komen ze op de wachtlijst (realistisch)
  });
  let added = 0;
  let seq = regs.length + 1;
  for (let i = 0; i < batch && open.length; i++) {
    const klas = pick(rng, open);
    const st = klasState(klas.id, regs);
    const reg = buildRegistration(rng, klas.id, seq, {
      status: st.full || st.closed ? "wachtlijst" : "nieuw",
      forceFlag: rng() < 0.18 ? "tall" : rng() < 0.12 ? "medisch" : null,
    });
    reg.ts = Date.now();
    regs.push(reg);
    seq++;
    added++;
  }
  setRegistrations(regs);
  notify();
  return added;
}

// ─── Reset ───────────────────────────────────────────────────────────────────
export function resetAll(): void {
  if (!hasLS()) return;
  [K.regs, K.bookings, K.overrides, K.settings, K.seeded].forEach((k) => localStorage.removeItem(k));
  notify();
}
export function resetRegistrations(): void {
  if (!hasLS()) return;
  localStorage.removeItem(K.regs);
  localStorage.removeItem(K.seeded);
  notify();
}
export function resetOverrides(): void {
  setOverrides({});
  notify();
}
