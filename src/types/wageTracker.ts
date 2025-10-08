export type PayDay = {
  /** Epoch ms (local) when pay was received or posted */
  date: number;
  gross: number;
  taxes: number;
  net: number;
};

export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';

/**
 * When pay occurs. For biweekly you can (optionally) provide an anchor date to
 * lock the alternating weeks. If omitted, "next weekday" logic is used.
 */
export type Schedule = {
  payFrequency: PayFrequency;

  /** For weekly/biweekly */
  dayOfWeek?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

  /** For monthly (1..31). If the month is shorter, use the last valid day. */
  dayOfMonth?: number;

  /**
   * Optional: anchor date (epoch ms) for biweekly cadence alignment.
   * Example: your known last/first payday — repeats every 14 days from this.
   */
  biweeklyAnchorDate?: number;

  /** Optional time to schedule reminders (24h clock). Defaults to 9:00 */
  hour?: number;      // 0..23
  minute?: number;    // 0..59
};

export type Employer = {
  id: string;          // e.g., uuid
  name: string;        // "Starbucks", "Freelance", etc.
  color?: string;      // optional accent color for UI
  schedule: Schedule;  // how this source pays you
  history: PayDay[];   // paychecks for this employer
};
