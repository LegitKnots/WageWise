import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Employer,
  PayDay,
  Schedule,
  PayBreakdownItem,
  PayStructure,
} from "types/wageTracker";

/** Storage (new) */
const STORAGE_KEY_V3 = "@app:wage-tracker:v3";
/** Backward-compat key from your previous version */
const STORAGE_KEY_V2 = "@app:wage-tracker:v2";

/** ---------- Local helpers/types ---------- */
type WageTrackerState = {
  employers: Employer[];
};

const DEFAULT_STATE: WageTrackerState = { employers: [] };

const DOW = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const dayNameToIndex = (d: NonNullable<Schedule["dayOfWeek"]>) =>
  DOW.indexOf(d as any);

function clampDayOfMonth(year: number, monthZero: number, dom: number) {
  const lastDay = new Date(year, monthZero + 1, 0).getDate();
  return Math.max(1, Math.min(lastDay, dom));
}

function atTime(date: Date, hour = 9, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function nextWeekly(
  from: Date,
  weekday: NonNullable<Schedule["dayOfWeek"]>,
  hour?: number,
  minute?: number
) {
  const base = atTime(from, hour, minute);
  const targetIdx = dayNameToIndex(weekday);
  const todayIdx = base.getDay();
  let delta = targetIdx - todayIdx;
  if (delta <= 0) delta += 7;
  return atTime(addDays(base, delta), hour, minute);
}

function nextMonthly(from: Date, dom: number, hour?: number, minute?: number) {
  const base = atTime(from, hour, minute);
  const safeDom = clampDayOfMonth(base.getFullYear(), base.getMonth(), dom);
  const candidate = atTime(
    new Date(base.getFullYear(), base.getMonth(), safeDom),
    hour,
    minute
  );
  if (candidate.getTime() > base.getTime()) return candidate;
  const nextMonthDom = clampDayOfMonth(
    base.getFullYear(),
    base.getMonth() + 1,
    dom
  );
  return atTime(
    new Date(base.getFullYear(), base.getMonth() + 1, nextMonthDom),
    hour,
    minute
  );
}

function nextBiweekly(from: Date, schedule: Schedule) {
  const hour = schedule.hour ?? 9;
  const minute = schedule.minute ?? 0;

  if (schedule.biweeklyAnchorDate && schedule.biweeklyAnchorDate > 0) {
    const anchor = atTime(new Date(schedule.biweeklyAnchorDate), hour, minute);
    const base = atTime(from, hour, minute);
    if (base.getTime() <= anchor.getTime()) return anchor;

    const MS_14D = 14 * 24 * 60 * 60 * 1000;
    const diff = base.getTime() - anchor.getTime();
    const k = Math.ceil(diff / MS_14D);
    return new Date(anchor.getTime() + k * MS_14D);
  }

  const weekday = schedule.dayOfWeek ?? "friday";
  return nextWeekly(from, weekday, hour, minute);
}

function computeNextPayDateForSchedule(
  schedule: Schedule | null,
  from = new Date()
): Date | null {
  if (!schedule) return null;
  const { payFrequency, dayOfWeek, dayOfMonth, hour, minute } = schedule;

  if (payFrequency === "monthly") {
    return nextMonthly(from, dayOfMonth ?? 1, hour, minute);
  }
  if (payFrequency === "weekly") {
    return nextWeekly(from, dayOfWeek ?? "friday", hour, minute);
  }
  return nextBiweekly(from, schedule);
}

/** ---------- Sorting/derived helpers ---------- */
function sortHistory(h: PayDay[]) {
  return [...h].sort((a, b) => a.date - b.date);
}
function currencyAvg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

/** Compute gross/net from breakdown if missing */
function deriveTotalsFromBreakdown(p: PayDay): PayDay {
  let gross = p.gross ?? 0;
  if ((p as any).breakdown && Array.isArray((p as any).breakdown)) {
    const sum = (p as any).breakdown.reduce(
      (s: number, b: PayBreakdownItem) =>
        s + (b && typeof (b as any).amount === "number" ? (b as any).amount : 0),
      0
    );
    gross = sum;
  }
  const taxes = typeof p.taxes === "number" ? p.taxes : 0;
  const net = typeof p.net === "number" ? p.net : gross - taxes;
  return { ...p, gross, taxes, net };
}

/** Provide a default pay structure when missing (migration) */
function getDefaultPayStructure(): PayStructure {
  return { base: "hourly", defaultRate: undefined, extras: [] };
}

/** Context shape */
type WageTrackerContextValue = {
  loading: boolean;
  employers: Employer[];

  addEmployer: (
    employer: Omit<Employer, "history"> & { history?: PayDay[] }
  ) => Promise<string>;
  updateEmployer: (
    id: string,
    patch: Partial<Omit<Employer, "id">>
  ) => Promise<void>;
  deleteEmployer: (id: string) => Promise<void>;

  addPayday: (
    employerId: string,
    entry: PayDay,
    replaceIfSameDate?: boolean
  ) => Promise<void>;
  upsertPayday: (employerId: string, entry: PayDay) => Promise<void>;
  deletePaydayByDate: (employerId: string, dateMs: number) => Promise<void>;
  setEmployerHistory: (employerId: string, next: PayDay[]) => Promise<void>;

  nextPayDates: { employerId: string; date: Date }[];
  nextSoonest: { employerId: string; date: Date } | null;

  stats: {
    lastNet: number;
    avgNet: number;
    ytdNet: number;
    ytdTax: number;
  };
};

const WageTrackerContext = createContext<WageTrackerContextValue | null>(null);

/** -------------------- Provider -------------------- */
export const WageTrackerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<WageTrackerState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false);

  /** ------ IO (read/write with migration) ------ */
  const parseEmployers = useCallback((parsed: any): Employer[] => {
    const employers: Employer[] = Array.isArray(parsed?.employers)
      ? parsed.employers.map((e: any) => {
          const schedule: Schedule = {
            payFrequency: (e?.schedule?.payFrequency ??
              "biweekly") as Schedule["payFrequency"],
            dayOfWeek: e?.schedule?.dayOfWeek,
            dayOfMonth: e?.schedule?.dayOfMonth,
            biweeklyAnchorDate:
              typeof e?.schedule?.biweeklyAnchorDate === "number"
                ? e.schedule.biweeklyAnchorDate
                : undefined,
            hour:
              typeof e?.schedule?.hour === "number" ? e.schedule.hour : undefined,
            minute:
              typeof e?.schedule?.minute === "number"
                ? e.schedule.minute
                : undefined,
          };

          // v2 didn't have payStructure; default it
          const payStructure: PayStructure =
            e?.payStructure && e?.payStructure?.base
              ? {
                  base: e.payStructure.base === "salary" ? "salary" : "hourly",
                  defaultRate: typeof e.payStructure?.defaultRate === "number" ? e.payStructure.defaultRate : undefined,
                  extras: Array.isArray(e?.payStructure?.extras)
                    ? e.payStructure.extras.map((x: any) => ({
                        kind: x?.kind ?? "custom",
                        label: String(x?.label ?? "Extra"),
                      }))
                    : [],
                }
              : getDefaultPayStructure();

          // History migration: v2 entries had just gross/taxes/net; make a minimal breakdown
          const history: PayDay[] = Array.isArray(e?.history)
            ? e.history
                .map((p: any) => {
                  const base: PayDay = {
                    date: Number(p?.date) || 0,
                    gross: Number(p?.gross ?? 0),
                    taxes: Number(p?.taxes ?? 0),
                    net: Number(p?.net ?? 0),
                    // v3 field—populate if provided
                    breakdown: Array.isArray(p?.breakdown)
                      ? p.breakdown
                      : [
                          {
                            kind: "custom",
                            label: "Pay",
                            amount: Number(p?.gross ?? 0),
                          } as PayBreakdownItem,
                        ],
                  } as any;
                  return base.date > 0 ? deriveTotalsFromBreakdown(base) : null;
                })
                .filter(Boolean) as PayDay[]
            : [];

          return {
            id: String(e?.id ?? ""),
            name: String(e?.name ?? "Employer"),
            color: e?.color ? String(e.color) : undefined,
            schedule,
            payStructure,
            history,
          } as Employer;
        })
      : [];

    for (const emp of employers) emp.history = sortHistory(emp.history);
    return employers;
  }, []);

  const readFromStorage = useCallback(async (): Promise<WageTrackerState> => {
    try {
      // Prefer v3; if missing, try v2 and migrate
      const rawV3 = await AsyncStorage.getItem(STORAGE_KEY_V3);
      if (rawV3) {
        const parsed = JSON.parse(rawV3);
        return { employers: parseEmployers(parsed) };
      }
      const rawV2 = await AsyncStorage.getItem(STORAGE_KEY_V2);
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        const employers = parseEmployers(parsed);
        // Save migrated data into v3 key
        await AsyncStorage.setItem(
          STORAGE_KEY_V3,
          JSON.stringify({ employers })
        );
        return { employers };
      }
      return DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  }, [parseEmployers]);

  const writeToStorage = useCallback(async (next: WageTrackerState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_V3, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  /** Hydrate once */
  useEffect(() => {
    (async () => {
      const initial = await readFromStorage();
      setState(initial);
      hydratedRef.current = true;
      setLoading(false);
    })();
  }, [readFromStorage]);

  /** Persist on change (post-hydration) */
  useEffect(() => {
    if (!hydratedRef.current) return;
    writeToStorage(state).catch(() => {});
  }, [state, writeToStorage]);

  /** Stable employer mutation */
  const mutateEmployer = useCallback(
    (id: string, mut: (e: Employer) => Employer) => {
      setState((prev) => {
        const employers = prev.employers.map((e) => (e.id === id ? mut(e) : e));
        const next = { employers };
        writeToStorage(next).catch(() => {});
        return next;
      });
    },
    [writeToStorage]
  );

  /** ---------- Employer CRUD ---------- */
  const addEmployer = useCallback(
    async (emp: Omit<Employer, "history"> & { history?: PayDay[] }) => {
      const withHistory: Employer = {
        ...emp,
        payStructure: emp.payStructure ?? getDefaultPayStructure(),
        history: sortHistory(
          (emp.history ?? []).map(deriveTotalsFromBreakdown)
        ),
      };
      setState((prev) => {
        const next = { employers: [...prev.employers, withHistory] };
        writeToStorage(next).catch(() => {});
        return next;
      });
      return emp.id;
    },
    [writeToStorage]
  );

  const updateEmployer = useCallback(
    async (id: string, patch: Partial<Omit<Employer, "id">>) => {
      setState((prev) => {
        const next = {
          employers: prev.employers.map((e) =>
            e.id === id
              ? {
                  ...e,
                  ...patch,
                  schedule: { ...e.schedule, ...(patch.schedule ?? {}) },
                  payStructure: {
                    ...e.payStructure,
                    ...(patch.payStructure ?? {}),
                    extras:
                      patch.payStructure?.extras ?? e.payStructure.extras,
                  },
                  history: patch.history
                    ? sortHistory(patch.history.map(deriveTotalsFromBreakdown))
                    : e.history,
                }
              : e
          ),
        };
        writeToStorage(next).catch(() => {});
        return next;
      });
    },
    [writeToStorage]
  );

  const deleteEmployer = useCallback(
    async (id: string) => {
      setState((prev) => {
        const next = { employers: prev.employers.filter((e) => e.id !== id) };
        writeToStorage(next).catch(() => {});
        return next;
      });
    },
    [writeToStorage]
  );

  /** ---------- Paydays ---------- */
  const addPayday = useCallback(
    async (employerId: string, entry: PayDay, replaceIfSameDate = false) => {
      const normalized = deriveTotalsFromBreakdown(entry);
      mutateEmployer(employerId, (e) => {
        const filtered = replaceIfSameDate
          ? e.history.filter((p) => p.date !== normalized.date)
          : e.history;
        return { ...e, history: sortHistory([...filtered, normalized]) };
      });
    },
    [mutateEmployer]
  );

  const upsertPayday = useCallback(
    async (employerId: string, entry: PayDay) => {
      await addPayday(employerId, entry, true);
    },
    [addPayday]
  );

  const deletePaydayByDate = useCallback(
    async (employerId: string, dateMs: number) => {
      mutateEmployer(employerId, (e) => ({
        ...e,
        history: e.history.filter((p) => p.date !== dateMs),
      }));
    },
    [mutateEmployer]
  );

  const setEmployerHistory = useCallback(
    async (employerId: string, nextHist: PayDay[]) => {
      mutateEmployer(employerId, (e) => ({
        ...e,
        history: sortHistory(nextHist.map(deriveTotalsFromBreakdown)),
      }));
    },
    [mutateEmployer]
  );

  /** ---------- Derived ---------- */
  const nextPayDates = useMemo(() => {
    const arr: { employerId: string; date: Date }[] = [];
    for (const e of state.employers) {
      const d = computeNextPayDateForSchedule(e.schedule);
      if (d) arr.push({ employerId: e.id, date: d });
    }
    return arr.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [state.employers]);

  const nextSoonest = nextPayDates[0] ?? null;

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const all = state.employers.flatMap((e) => e.history);
    const ytd = all.filter((p) => new Date(p.date).getFullYear() === thisYear);
    const last = [...all].sort((a, b) => a.date - b.date).at(-1);

    return {
      lastNet: last?.net ?? 0,
      avgNet: currencyAvg(ytd.map((p) => p.net)),
      ytdNet: ytd.reduce((s, p) => s + p.net, 0),
      ytdTax: ytd.reduce((s, p) => s + p.taxes, 0),
    };
  }, [state.employers]);

  const value: WageTrackerContextValue = {
    loading,
    employers: state.employers,

    addEmployer,
    updateEmployer,
    deleteEmployer,

    addPayday,
    upsertPayday,
    deletePaydayByDate,
    setEmployerHistory,

    nextPayDates,
    nextSoonest,

    stats,
  };

  return (
    <WageTrackerContext.Provider value={value}>
      {children}
    </WageTrackerContext.Provider>
  );
};

/** Hook */
export function useWageTracker() {
  const ctx = useContext(WageTrackerContext);
  if (!ctx)
    throw new Error("useWageTracker must be used within a WageTrackerProvider");
  return ctx;
}
