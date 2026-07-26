import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  monthlyBudgetLimit: number;
  setMonthlyBudgetLimit: (limit: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      monthlyBudgetLimit: 0,
      setMonthlyBudgetLimit: (limit) => set({ monthlyBudgetLimit: limit }),
    }),
    {
      name: 'settings-store',
    }
  ),
);
