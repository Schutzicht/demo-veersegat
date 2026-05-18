export type CourseCategory = "kind" | "jeugd" | "volwassenen" | "weekend";

export interface Course {
  id: string;
  title: string;
  category: CourseCategory;
  age: string;
  boat: string;
  level: string;
  startDate: string; // ISO
  endDate: string;
  schedule: string; // "ma t/m vr · 9:30 – 16:00"
  price: number;
  capacity: number;
  preBooked: number; // realistic baseline so de demo niet leeg lijkt
}

export const courses: Course[] = [
  {
    id: "optifun-w28",
    title: "OptiFun jeugdweek",
    category: "kind",
    age: "6 – 9 jaar",
    boat: "Optimist",
    level: "Beginners",
    startDate: "2026-07-06",
    endDate: "2026-07-10",
    schedule: "ma t/m vr · 09:30 – 15:30",
    price: 285,
    capacity: 14,
    preBooked: 9,
  },
  {
    id: "optimist-w29",
    title: "Optimist jeugdweek",
    category: "jeugd",
    age: "8 – 13 jaar",
    boat: "Optimist",
    level: "CWO I & II",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    schedule: "ma t/m vr · 09:30 – 16:00",
    price: 315,
    capacity: 16,
    preBooked: 12,
  },
  {
    id: "laser-w29",
    title: "Laser Pico jeugdweek",
    category: "jeugd",
    age: "11 – 16 jaar",
    boat: "Laser Pico",
    level: "CWO II & III",
    startDate: "2026-07-13",
    endDate: "2026-07-17",
    schedule: "ma t/m vr · 09:30 – 16:00",
    price: 335,
    capacity: 12,
    preBooked: 12, // Vol
  },
  {
    id: "bahia-w30",
    title: "Bahia jeugdweek",
    category: "jeugd",
    age: "13 – 18 jaar",
    boat: "Bahia",
    level: "CWO II / III kielboot",
    startDate: "2026-07-20",
    endDate: "2026-07-24",
    schedule: "ma t/m vr · 09:30 – 16:30",
    price: 395,
    capacity: 12,
    preBooked: 5,
  },
  {
    id: "valk-w31",
    title: "Valk volwassenenweek",
    category: "volwassenen",
    age: "vanaf 18 jaar",
    boat: "Valk",
    level: "CWO I, II of III",
    startDate: "2026-07-27",
    endDate: "2026-07-31",
    schedule: "ma t/m vr · 10:00 – 16:30",
    price: 485,
    capacity: 16,
    preBooked: 7,
  },
  {
    id: "weekend-valk-mei",
    title: "Weekendcursus Valk",
    category: "weekend",
    age: "vanaf 18 jaar",
    boat: "Valk",
    level: "Kennismaking / CWO I",
    startDate: "2026-05-16",
    endDate: "2026-05-17",
    schedule: "za + zo · 10:00 – 16:00",
    price: 245,
    capacity: 10,
    preBooked: 3,
  },
  {
    id: "weekend-bahia-juni",
    title: "Weekendcursus Bahia",
    category: "weekend",
    age: "vanaf 14 jaar",
    boat: "Bahia",
    level: "CWO II kielboot",
    startDate: "2026-06-13",
    endDate: "2026-06-14",
    schedule: "za + zo · 10:00 – 16:00",
    price: 265,
    capacity: 10,
    preBooked: 6,
  },
  {
    id: "herfstweek-w42",
    title: "Herfstweek allround",
    category: "jeugd",
    age: "9 – 15 jaar",
    boat: "Optimist & Laser",
    level: "CWO I – III",
    startDate: "2026-10-19",
    endDate: "2026-10-23",
    schedule: "ma t/m vr · 09:30 – 15:30",
    price: 295,
    capacity: 18,
    preBooked: 4,
  },
];

export const categoryLabels: Record<CourseCategory, string> = {
  kind: "Kinderen",
  jeugd: "Jeugd",
  volwassenen: "Volwassenen",
  weekend: "Weekend",
};

export function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sameMonth = start.getMonth() === end.getMonth();
  const monthLong = end.toLocaleDateString("nl-NL", { month: "long" });
  if (sameMonth) {
    return `${start.getDate()} – ${end.getDate()} ${monthLong}`;
  }
  const startMonth = start.toLocaleDateString("nl-NL", { month: "short" });
  return `${start.getDate()} ${startMonth} – ${end.getDate()} ${monthLong}`;
}
