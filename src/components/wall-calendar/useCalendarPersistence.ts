"use client";

import { useCallback, useMemo, useState } from "react";
import { monthKey, selectionStorageKey } from "@/lib/calendar";

const STORAGE_KEY = "wall-calendar-notes-v1";

type Persisted = {
  v: 1;
  monthNotes: Record<string, string>;
  selectionNotes: Record<string, string>;
};

function load(): Persisted {
  if (typeof globalThis.window === "undefined") {
    return { v: 1, monthNotes: {}, selectionNotes: {} };
  }
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, monthNotes: {}, selectionNotes: {} };
    const parsed = JSON.parse(raw) as Persisted;
    if (parsed?.v !== 1) return { v: 1, monthNotes: {}, selectionNotes: {} };
    return {
      v: 1,
      monthNotes: parsed.monthNotes ?? {},
      selectionNotes: parsed.selectionNotes ?? {},
    };
  } catch {
    return { v: 1, monthNotes: {}, selectionNotes: {} };
  }
}

function save(data: Persisted) {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function useCalendarPersistence(year: number, monthIndex: number) {
  const [data, setData] = useState<Persisted>(() => load());
  const mk = useMemo(() => monthKey(year, monthIndex), [year, monthIndex]);

  const merge = useCallback((updater: (prev: Persisted) => Persisted) => {
    setData((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  const monthNote = data.monthNotes[mk] ?? "";

  const setMonthNote = useCallback(
    (text: string) => {
      merge((prev) => ({
        ...prev,
        monthNotes: { ...prev.monthNotes, [mk]: text },
      }));
    },
    [merge, mk],
  );

  const getSelectionNote = useCallback(
    (start: Date, end: Date) => {
      const key = selectionStorageKey(start, end);
      return data.selectionNotes[key] ?? "";
    },
    [data.selectionNotes],
  );

  const setSelectionNote = useCallback(
    (start: Date, end: Date, text: string) => {
      const key = selectionStorageKey(start, end);
      merge((prev) => ({
        ...prev,
        selectionNotes: { ...prev.selectionNotes, [key]: text },
      }));
    },
    [merge],
  );

  const clearSelectionNote = useCallback(
    (start: Date, end: Date) => {
      const key = selectionStorageKey(start, end);
      merge((prev) => {
        const rest = { ...prev.selectionNotes };
        delete rest[key];
        return { ...prev, selectionNotes: rest };
      });
    },
    [merge],
  );

  return {
    monthNote,
    setMonthNote,
    getSelectionNote,
    setSelectionNote,
    clearSelectionNote,
  };
}
