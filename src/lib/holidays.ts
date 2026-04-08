/** Fixed US federal / common observances (month 1–12, day). */
const FIXED: Record<number, readonly { day: number; label: string }[]> = {
  1: [
    { day: 1, label: "New Year's Day" },
    { day: 20, label: "MLK Day (approx.)" },
  ],
  2: [{ day: 14, label: "Valentine's Day" }],
  3: [{ day: 17, label: "St. Patrick's Day" }],
  5: [
    { day: 27, label: "Memorial Day (approx.)" },
    { day: 31, label: "Memorial Day (approx.)" },
  ],
  7: [{ day: 4, label: "Independence Day" }],
  9: [{ day: 1, label: "Labor Day (approx.)" }],
  10: [{ day: 31, label: "Halloween" }],
  11: [
    { day: 11, label: "Veterans Day" },
    { day: 27, label: "Thanksgiving (approx.)" },
  ],
  12: [{ day: 25, label: "Christmas" }],
};

export type HolidayMark = { day: number; label: string };

/** Lightweight hints for the grid — some dates are approximate for demo. */
export function getHolidayMarksForMonth(year: number, monthIndex: number): HolidayMark[] {
  const month = monthIndex + 1;
  const list = FIXED[month];
  if (!list) return [];

  return list
    .map((h) => ({ day: h.day, label: h.label }))
    .filter((h) => {
      const last = new Date(year, monthIndex + 1, 0).getDate();
      return h.day >= 1 && h.day <= last;
    });
}
