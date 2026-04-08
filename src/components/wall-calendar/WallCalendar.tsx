"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import {
  buildMonthGrid,
  compareDateKeys,
  formatMonthTitle,
  isDateInRange,
  isToday,
  isWeekend,
  monthKey,
  parseDateKey,
  toDateKey,
  WEEKDAYS_MON_FIRST,
} from "@/lib/calendar";
import { getHolidayMarksForMonth } from "@/lib/holidays";
import { useCalendarPersistence } from "./useCalendarPersistence";

const HERO_SRC =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2000&auto=format&fit=crop";

function formatRangeLabel(start: Date, end: Date): string {
  if (toDateKey(start) === toDateKey(end)) {
    return start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const a = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
  const b = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${a} – ${b}`;
}

export function WallCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const rangeByMonthRef = useRef<Record<string, { start: string | null; end: string | null }>>({});

  const {
    monthNote,
    setMonthNote,
    getSelectionNote,
    setSelectionNote,
    clearSelectionNote,
  } = useCalendarPersistence(year, monthIndex);

  const [selectionDraft, setSelectionDraft] = useState("");

  const grid = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
  const holidayByDay = useMemo(() => {
    const marks = getHolidayMarksForMonth(year, monthIndex);
    const m = new Map<number, string>();
    for (const h of marks) m.set(h.day, h.label);
    return m;
  }, [year, monthIndex]);

  const effectiveRange = useMemo(() => {
    if (!rangeStart) return null;
    if (!rangeEnd) return { start: rangeStart, end: rangeStart };
    const a = compareDateKeys(rangeStart, rangeEnd) <= 0 ? rangeStart : rangeEnd;
    const b = compareDateKeys(rangeStart, rangeEnd) <= 0 ? rangeEnd : rangeStart;
    return { start: a, end: b };
  }, [rangeStart, rangeEnd]);

  const currentMonthKey = monthKey(year, monthIndex);

  const loadSelectionDraftForRange = (start: Date | null, end: Date | null) => {
    if (!start) {
      setSelectionDraft("");
      return;
    }
    const resolvedEnd = end ?? start;
    const a = compareDateKeys(start, resolvedEnd) <= 0 ? start : resolvedEnd;
    const b = compareDateKeys(start, resolvedEnd) <= 0 ? resolvedEnd : start;
    setSelectionDraft(getSelectionNote(a, b));
  };

  const setRangeForMonth = (mk: string, start: Date | null, end: Date | null) => {
    rangeByMonthRef.current[mk] = {
      start: start ? toDateKey(start) : null,
      end: end ? toDateKey(end) : null,
    };
  };

  const applySavedRangeForMonth = (mk: string) => {
    const saved = rangeByMonthRef.current[mk];
    if (!saved) {
      setRangeStart(null);
      setRangeEnd(null);
      setSelectionDraft("");
      return;
    }
    const nextStart = saved.start ? parseDateKey(saved.start) : null;
    const nextEnd = saved.end ? parseDateKey(saved.end) : null;
    setRangeStart(nextStart);
    setRangeEnd(nextEnd);
    loadSelectionDraftForRange(nextStart, nextEnd);
  };

  const handleDayClick = (d: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d);
      setRangeEnd(null);
      setRangeForMonth(currentMonthKey, d, null);
      loadSelectionDraftForRange(d, null);
      return;
    }
    if (compareDateKeys(d, rangeStart) < 0) {
      setRangeEnd(rangeStart);
      setRangeStart(d);
      setRangeForMonth(currentMonthKey, d, rangeStart);
      loadSelectionDraftForRange(d, rangeStart);
    } else {
      setRangeEnd(d);
      setRangeForMonth(currentMonthKey, rangeStart, d);
      loadSelectionDraftForRange(rangeStart, d);
    }
  };

  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
    setSelectionDraft("");
    setRangeForMonth(currentMonthKey, null, null);
  };

  const goMonth = (delta: number) => {
    setRangeForMonth(currentMonthKey, rangeStart, rangeEnd);
    const d = new Date(year, monthIndex + delta, 1);
    const nextMonthKey = monthKey(d.getFullYear(), d.getMonth());
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
    applySavedRangeForMonth(nextMonthKey);
  };

  const monthTitle = formatMonthTitle(year, monthIndex);

  return (
    <div className="wall-calendar-root min-h-full overflow-x-hidden bg-[#d4d4d4] px-3 py-8 sm:px-6 md:py-12">
      <div className="mx-auto max-w-5xl">
        <p className="mb-4 text-center text-sm text-neutral-600 md:text-left">
          Tap a day to set the start, then another day for the end. Tap again to start over.
        </p>

        <article
          className="relative overflow-hidden rounded-sm bg-white shadow-[-12px_18px_40px_rgba(0,0,0,0.18)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 hover:shadow-[-14px_22px_48px_rgba(0,0,0,0.2)]"
          style={{ perspective: "1200px" }}
        >
          {/* Spiral binding */}
          <div
            className="relative z-20 flex h-7 justify-center gap-3 border-b border-neutral-200 bg-gradient-to-b from-neutral-100 to-white pt-1"
            aria-hidden
          >
            {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((id) => (
              <span
                key={id}
                className="inline-block size-2.5 rounded-full border border-neutral-400/80 bg-neutral-300/90 shadow-inner"
              />
            ))}
          </div>

          {/* Hero */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-800 sm:aspect-[16/9] md:aspect-[2.2/1]">
            <Image
              src={HERO_SRC}
              alt="Seasonal landscape for the calendar month"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
              aria-hidden
            />
            {/* Angular panel like reference */}
            <div
              className="absolute bottom-0 right-0 flex w-[min(100%,420px)] items-end justify-end pb-4 pr-5 pt-16 pl-10 sm:pb-5 sm:pr-8"
              style={{
                background: "linear-gradient(135deg, transparent 0%, transparent 18%, #1e5a8a 18%, #2d7ab8 45%, #e8f4fc 100%)",
                clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              <div className="text-right drop-shadow-md">
                <p className="text-3xl font-semibold tracking-[0.2em] text-white sm:text-4xl md:text-5xl">
                  {year}
                </p>
                <p className="mt-1 text-lg font-medium tracking-[0.35em] text-white/95 sm:text-xl">
                  {monthTitle.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Lower panel: notes + grid */}
          <div className="grid gap-0 bg-white md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-px md:bg-neutral-200">
            <NotesColumn
              className="order-2 md:order-1"
              monthLabel={`${monthTitle} ${year}`}
              monthNote={monthNote}
              onMonthNoteChange={setMonthNote}
              selectionLabel={
                effectiveRange ? formatRangeLabel(effectiveRange.start, effectiveRange.end) : null
              }
              selectionDraft={selectionDraft}
              onSelectionDraftChange={setSelectionDraft}
              onSelectionBlur={() => {
                if (rangeStart) {
                  const end = rangeEnd ?? rangeStart;
                  const a = compareDateKeys(rangeStart, end) <= 0 ? rangeStart : end;
                  const b = compareDateKeys(rangeStart, end) <= 0 ? end : rangeStart;
                  setSelectionNote(a, b, selectionDraft);
                }
              }}
              onClearSelectionNotes={() => {
                if (rangeStart) {
                  const end = rangeEnd ?? rangeStart;
                  const a = compareDateKeys(rangeStart, end) <= 0 ? rangeStart : end;
                  const b = compareDateKeys(rangeStart, end) <= 0 ? end : rangeStart;
                  clearSelectionNote(a, b);
                  setSelectionDraft("");
                }
              }}
              hasSelection={Boolean(rangeStart)}
              onClearRange={clearRange}
            />

            <div className="order-1 min-w-0 bg-white p-4 sm:p-5 md:order-2 md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => goMonth(-1)}
                    className="touch-manipulation rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 active:scale-[0.98]"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => goMonth(1)}
                    className="touch-manipulation rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 active:scale-[0.98]"
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = new Date();
                      setRangeForMonth(currentMonthKey, rangeStart, rangeEnd);
                      setYear(t.getFullYear());
                      setMonthIndex(t.getMonth());
                      const tKey = monthKey(t.getFullYear(), t.getMonth());
                      applySavedRangeForMonth(tKey);
                    }}
                    className="touch-manipulation rounded-md border border-transparent bg-sky-100 px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-200 active:scale-[0.98]"
                  >
                    Today
                  </button>
                </div>
                {effectiveRange && (
                  <span className="text-xs text-neutral-500">
                    Range: {formatRangeLabel(effectiveRange.start, effectiveRange.end)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center text-[10px] font-medium tracking-wide text-neutral-800 sm:text-xs">
                {WEEKDAYS_MON_FIRST.map((d) => (
                  <div key={d} className="py-2 text-neutral-600">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 transition-colors duration-200">
                {grid.map((cell) => {
                  const k = toDateKey(cell.date);
                  const inSel =
                    effectiveRange &&
                    isDateInRange(cell.date, effectiveRange.start, effectiveRange.end);
                  const isStart = Boolean(effectiveRange && k === toDateKey(effectiveRange.start));
                  const isEnd = Boolean(effectiveRange && k === toDateKey(effectiveRange.end));
                  const isSingleDay = Boolean(isStart && isEnd);
                  const today = isToday(k);
                  const weekend = isWeekend(cell.date);
                  const hol = cell.inCurrentMonth ? holidayByDay.get(cell.date.getDate()) : undefined;

                  return (
                    <button
                      key={k + (cell.inCurrentMonth ? "m" : "o")}
                      type="button"
                      onClick={() => handleDayClick(cell.date)}
                      className={[
                        "relative flex min-h-[44px] flex-col items-center justify-center border text-sm shadow-sm transition-[background-color,color,transform,box-shadow] duration-200 touch-manipulation sm:min-h-[48px]",
                        !cell.inCurrentMonth && "text-neutral-400",
                        cell.inCurrentMonth && !weekend && "text-neutral-900",
                        cell.inCurrentMonth && weekend && "text-sky-700/90 bg-sky-50/30",
                        inSel && "border-sky-200 bg-sky-100/70",
                        (isStart || isEnd) && "z-[1] border-sky-500 bg-sky-500 text-white shadow-[0_4px_10px_rgba(14,116,144,0.25)]",
                        isSingleDay && "rounded-full",
                        isStart && !isSingleDay && "rounded-l-full rounded-r-none",
                        isEnd && !isSingleDay && "rounded-r-full rounded-l-none",
                        inSel && !isStart && !isEnd && "rounded-none",
                        !inSel && "rounded-md border-transparent",
                        today && "ring-1 ring-amber-400/80 ring-inset",
                        cell.inCurrentMonth &&
                          "hover:z-[1] hover:scale-[1.03] hover:bg-neutral-100 hover:shadow active:scale-[0.99]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="font-medium">{cell.date.getDate()}</span>
                      {today && (
                        <span
                          className={[
                            "absolute right-1.5 top-1.5 size-1.5 rounded-full",
                            inSel ? "bg-white/90" : "bg-amber-500",
                          ].join(" ")}
                        />
                      )}
                      {hol && (
                        <span
                          className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-amber-500"
                          title={hol}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-neutral-500">
                <span className="mr-1 inline-block size-2 rounded-full bg-amber-500 align-middle" />{" "}
                Dot = holiday hint (demo). Weekend days use a cooler tone like the reference.
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function NotesColumn(props: Readonly<{
  className?: string;
  monthLabel: string;
  monthNote: string;
  onMonthNoteChange: (v: string) => void;
  selectionLabel: string | null;
  selectionDraft: string;
  onSelectionDraftChange: (v: string) => void;
  onSelectionBlur: () => void;
  onClearSelectionNotes: () => void;
  hasSelection: boolean;
  onClearRange: () => void;
}>) {
  return (
    <aside
      className={[
        "flex min-w-0 flex-col border-t border-neutral-200 bg-white p-4 sm:p-5 md:border-t-0 md:border-r-0",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-800">Notes</h2>
      <p className="mt-1 text-xs text-neutral-500">Saved in your browser (localStorage).</p>

      <label className="mt-4 block text-xs font-medium text-neutral-600">{props.monthLabel}</label>
      <textarea
        className="mt-1 min-h-[120px] w-full resize-y rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-inner outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-2 md:min-h-[140px]"
        placeholder="Month memo — goals, reminders…"
        value={props.monthNote}
        onChange={(e) => props.onMonthNoteChange(e.target.value)}
      />

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <label className="block text-xs font-medium text-neutral-600">
          Selection notes
          {props.selectionLabel ? (
            <span className="mt-0.5 block font-normal text-neutral-500">{props.selectionLabel}</span>
          ) : (
            <span className="mt-0.5 block font-normal text-neutral-400">Select a date range on the grid</span>
          )}
        </label>
        <textarea
          disabled={!props.hasSelection}
          className="mt-1 min-h-[100px] w-full resize-y rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 shadow-inner outline-none ring-sky-500/40 focus:border-sky-500 focus:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400"
          placeholder={
            props.hasSelection ? "Notes for this range…" : "Pick start and end dates first"
          }
          value={props.selectionDraft}
          onChange={(e) => props.onSelectionDraftChange(e.target.value)}
          onBlur={props.onSelectionBlur}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!props.hasSelection}
            onClick={props.onClearSelectionNotes}
            className="touch-manipulation rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          >
            Clear selection notes
          </button>
          <button
            type="button"
            disabled={!props.hasSelection}
            onClick={props.onClearRange}
            className="touch-manipulation rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          >
            Clear range
          </button>
        </div>
      </div>
    </aside>
  );
}
