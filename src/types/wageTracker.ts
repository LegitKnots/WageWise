// types/wageTracker.ts

/** Payday entry */
export type PayDay = {
  /** Epoch ms (local) when pay was received or posted */
  date: number;

  /** Line-items that sum to gross (driven by employer's payStructure) */
  breakdown: PayBreakdownItem[];

  /** Derived but stored for convenience/history charts */
  gross: number;
  taxes: number;
  net: number; // = gross - taxes
};

/** Recurrence cadence */
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';

/** Schedule for when pay lands */
export type Schedule = {
  payFrequency: PayFrequency;

  /** For weekly/biweekly */
  dayOfWeek?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

  /** For monthly (1..31). If the month is shorter, use the last valid day. */
  dayOfMonth?: number;

  /** Anchor date (epoch ms) to align the 14-day cadence for biweekly */
  biweeklyAnchorDate?: number;

  /** Optional reminder time (24h clock). Defaults to 9:00 */
  hour?: number;   // 0..23
  minute?: number; // 0..59
};

/** Supported components for compensation */
export type PayComponentKind =
  | 'hourly'     // base (hours × rate)
  | 'salary'     // base (flat amount)
  | 'commission' // extra
  | 'tips'       // extra
  | 'bonus'      // extra
  | 'custom';    // extra with custom label (e.g., SPIFF)

/** Employer-level pay structure */
export type PayStructure = {
  /** Choose exactly one base type */
  base: 'hourly' | 'salary';

  /**
   * Default hourly rate for this employer (only used when base is 'hourly').
   * This will pre-fill the rate field when adding new paychecks.
   */
  defaultRate?: number;

  /**
   * Extra components available for this employer.
   * Example: [{ kind:'commission', label:'Commission' }, { kind:'custom', label:'SPIFF' }]
   */
  extras: Array<{ kind: Exclude<PayComponentKind, 'hourly' | 'salary'>; label: string }>;
};

/** Per-payday breakdown item */
export type PayBreakdownItem =
  | {
      kind: 'hourly';
      label: 'Hourly';
      hours: number;
      rate: number;
      amount: number; // hours * rate
    }
  | {
      kind: 'salary';
      label: 'Salary';
      amount: number;
    }
  | {
      kind: Exclude<PayComponentKind, 'hourly' | 'salary'>; // commission | tips | bonus | custom
      label: string; // e.g., Commission, Tips, SPIFF
      amount: number;
    };

export type Employer = {
  id: string;          // uuid or similar
  name: string;        // "CycleGear", etc.
  color?: string;      // UI accent
  schedule: Schedule;  // when this source pays you
  payStructure: PayStructure; // how this job pays you
  history: PayDay[];   // paychecks
};
