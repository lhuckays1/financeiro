import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js';
import { Category, Transaction, AuthUser } from '../types';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL || '';
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL || '';

export const isNeonConfigured = Boolean(neonAuthUrl && neonDataApiUrl);

// The Neon adapter preserves Supabase Auth method names while sending data
// queries to Neon's PostgREST-compatible Data API.
export const neon = isNeonConfigured
  ? createClient({
      auth: {
        adapter: SupabaseAuthAdapter({
          // Keep active mobile sessions fresh; focus/online refresh is also
          // enabled by Neon Auth. The server still controls absolute expiry.
          sessionOptions: {
            refetchInterval: 60 * 60 * 12,
            refetchOnWindowFocus: true,
            refetchWhenOffline: false,
          },
        }),
        url: neonAuthUrl,
      },
      dataApi: {
        url: neonDataApiUrl,
      },
    })
  : null;

export const DEFAULT_CATEGORIES = [
  { name: 'Salário', type: 'ganho', color: '#10B981' },
  { name: 'Freelance', type: 'ganho', color: '#22C55E' },
  { name: 'Vendas', type: 'ganho', color: '#14B8A6' },
  { name: 'Investimentos', type: 'ganho', color: '#0EA5E9' },
  { name: 'Outros', type: 'ganho', color: '#6366F1' },
  { name: 'Alimentação', type: 'gasto', color: '#EF4444' },
  { name: 'Transporte', type: 'gasto', color: '#F59E0B' },
  { name: 'Moradia', type: 'gasto', color: '#F97316' },
  { name: 'Lazer', type: 'gasto', color: '#EC4899' },
  { name: 'Saúde', type: 'gasto', color: '#8B5CF6' },
  { name: 'Assinaturas', type: 'gasto', color: '#A855F7' },
  { name: 'Outros', type: 'gasto', color: '#64748B' },
] as const;

const STORAGE_KEYS = {
  USER: 'finflow_demo_user',
  CATEGORIES: 'finflow_categories',
  TRANSACTIONS: 'finflow_transactions',
};

const getDemoUser = (): AuthUser | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

const setDemoUser = (user: AuthUser | null) => {
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getStoredCategories = (userId: string): Category[] => {
  const raw = localStorage.getItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* seed demo defaults */ }
  }
  const categories: Category[] = DEFAULT_CATEGORIES.map((category, i) => ({
    id: `cat_default_${i}_${Date.now()}`,
    user_id: userId,
    name: category.name,
    type: category.type as 'ganho' | 'gasto',
    color: category.color,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`, JSON.stringify(categories));
  return categories;
};

export const saveStoredCategories = (userId: string, categories: Category[]) => {
  localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`, JSON.stringify(categories));
};

export const getStoredTransactions = (userId: string): Transaction[] => {
  const raw = localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* seed demo defaults */ }
  }
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const transactions: Transaction[] = [
    { id: 'tx_1', user_id: userId, type: 'ganho', description: 'Salário Mensal', amount: 6500, category: 'Salário', date: `${y}-${m}-01`, created_at: today.toISOString() },
    { id: 'tx_2', user_id: userId, type: 'ganho', description: 'Projeto Freelance Website', amount: 1800, category: 'Freelance', date: `${y}-${m}-08`, created_at: today.toISOString() },
    { id: 'tx_3', user_id: userId, type: 'gasto', description: 'Supermercado Mensal', amount: 1250.4, category: 'Alimentação', date: `${y}-${m}-03`, created_at: today.toISOString() },
    { id: 'tx_4', user_id: userId, type: 'gasto', description: 'Aluguel do Apê', amount: 2200, category: 'Moradia', date: `${y}-${m}-05`, created_at: today.toISOString() },
    { id: 'tx_5', user_id: userId, type: 'gasto', description: 'Combustível Posto Shell', amount: 280, category: 'Transporte', date: `${y}-${m}-10`, created_at: today.toISOString() },
    { id: 'tx_6', user_id: userId, type: 'gasto', description: 'Assinaturas (Netflix & Spotify)', amount: 79.9, category: 'Assinaturas', date: `${y}-${m}-12`, created_at: today.toISOString() },
    { id: 'tx_7', user_id: userId, type: 'gasto', description: 'Jantar com Família', amount: 195.5, category: 'Alimentação', date: `${y}-${m}-15`, created_at: today.toISOString() },
  ];
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`, JSON.stringify(transactions));
  return transactions;
};

export const saveStoredTransactions = (userId: string, transactions: Transaction[]) => {
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`, JSON.stringify(transactions));
};

export { getDemoUser, setDemoUser };

