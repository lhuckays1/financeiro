import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PeriodPreset, PeriodRange } from '../types';
import { getPeriodRange } from '../lib/period';

interface PeriodState {
  preset: PeriodPreset;
  customFrom?: string; // ISO string
  customTo?: string; // ISO string
  setPeriod: (preset: PeriodPreset, from?: Date, to?: Date) => void;
  getRange: () => PeriodRange;
}

export const usePeriodStore = create<PeriodState>()(
  persist(
    (set, get) => ({
      preset: 'this_month',
      customFrom: undefined,
      customTo: undefined,

      setPeriod: (preset, from, to) => {
        set({
          preset,
          customFrom: from ? from.toISOString() : undefined,
          customTo: to ? to.toISOString() : undefined,
        });
      },

      getRange: () => {
        const { preset, customFrom, customTo } = get();
        const fromDate = customFrom ? new Date(customFrom) : undefined;
        const toDate = customTo ? new Date(customTo) : undefined;
        return getPeriodRange(preset, fromDate, toDate);
      },
    }),
    {
      name: 'period-store',
    }
  )
);
