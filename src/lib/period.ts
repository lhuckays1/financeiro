import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subDays,
  differenceInDays,
  eachDayOfInterval,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PeriodPreset, PeriodRange } from '../types';

export const getPeriodRange = (
  preset: PeriodPreset,
  customFrom?: Date,
  customTo?: Date
): PeriodRange => {
  const now = new Date();

  switch (preset) {
    case 'today':
      return {
        preset: 'today',
        from: startOfDay(now),
        to: endOfDay(now),
        label: 'Hoje',
      };
    case 'this_week':
      return {
        preset: 'this_week',
        from: startOfWeek(now, { weekStartsOn: 1, locale: ptBR }),
        to: endOfWeek(now, { weekStartsOn: 1, locale: ptBR }),
        label: 'Esta semana',
      };
    case 'this_month':
      return {
        preset: 'this_month',
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: 'Este mês',
      };
    case 'last_3_months': {
      const threeMonthsAgo = subMonths(now, 2);
      return {
        preset: 'last_3_months',
        from: startOfMonth(threeMonthsAgo),
        to: endOfMonth(now),
        label: 'Últimos 3 meses',
      };
    }
    case 'this_year':
      return {
        preset: 'this_year',
        from: startOfYear(now),
        to: endOfYear(now),
        label: 'Este ano',
      };
    case 'custom': {
      const from = customFrom || startOfMonth(now);
      const to = customTo || endOfDay(now);
      return {
        preset: 'custom',
        from: startOfDay(from),
        to: endOfDay(to),
        label: 'Personalizado',
      };
    }
    default:
      return {
        preset: 'this_month',
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: 'Este mês',
      };
  }
};

export const getPreviousPeriod = (from: Date, to: Date): { from: Date; to: Date } => {
  const diffDays = Math.max(1, differenceInDays(to, from) + 1);
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, diffDays - 1);
  return { from: startOfDay(prevFrom), to: endOfDay(prevTo) };
};

export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

export const getDaysInPeriod = (from: Date, to: Date): Date[] => {
  try {
    return eachDayOfInterval({ start: startOfDay(from), end: startOfDay(to) });
  } catch {
    return [from];
  }
};

export const formatDateKey = (d: Date): string => {
  return format(d, 'yyyy-MM-dd');
};

export const formatDateDisplayShort = (d: Date): string => {
  return format(d, 'dd/MM', { locale: ptBR });
};
