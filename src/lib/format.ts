import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatBRL = (n: number): string => {
  const safeNumber = isNaN(n) ? 0 : n;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeNumber);
};

export const formatDateBR = (d: string | Date): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? (d.includes('T') ? parseISO(d) : new Date(`${d}T00:00:00`)) : d;
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
};

export const maskCurrencyInput = (raw: string): string => {
  // Extract all digits
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 'R$ 0,00';
  const num = Number(digits) / 100;
  return formatBRL(num);
};

export const parseCurrencyToNumber = (raw: string): number => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
};

export const formatInputDate = (d: Date): string => {
  return format(d, 'yyyy-MM-dd');
};
