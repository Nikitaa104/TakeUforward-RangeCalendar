export const WEEKDAYS_MON_FIRST = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isToday(dateKey: string, baseDate = new Date()): boolean {
  return dateKey === toDateKey(baseDate);
}

export function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function compareDateKeys(a: Date, b: Date): number {
  return toDateKey(a).localeCompare(toDateKey(b));
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export type GridCell = {
  date: Date;
  inCurrentMonth: boolean;
};

export function buildMonthGrid(year: number, monthIndex: number): GridCell[] {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: GridCell[] = [];

  const prevMonthLast = new Date(year, monthIndex, 0).getDate();
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    cells.push({ date: new Date(year, monthIndex - 1, day), inCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, monthIndex, d), inCurrentMonth: true });
  }

  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, monthIndex + 1, next), inCurrentMonth: false });
    next += 1;
  }

  return cells;
}

export function formatMonthTitle(year: number, monthIndex: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(year, monthIndex, 1),
  );
}

export function selectionStorageKey(start: Date, end: Date): string {
  const a = toDateKey(start);
  const b = toDateKey(end);
  return a <= b ? `${a}|${b}` : `${b}|${a}`;
}

export function isDateInRange(d: Date, start: Date, end: Date): boolean {
  const k = toDateKey(d);
  const s = toDateKey(start <= end ? start : end);
  const e = toDateKey(start <= end ? end : start);
  return k >= s && k <= e;
}
