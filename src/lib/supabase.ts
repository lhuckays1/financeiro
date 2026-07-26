import { createClient } from '@supabase/supabase-js';
import { Category, Transaction, AuthUser } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'MY_SUPABASE_URL' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Default categories according to prompt spec 3.3
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

// Initial sample data for instant interactive demo experience
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
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

export const getStoredCategories = (userId: string): Category[] => {
  const raw = localStorage.getItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  // Seed default categories
  const defaultCats: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
    id: `cat_default_${i}_${Date.now()}`,
    user_id: userId,
    name: c.name,
    type: c.type as 'ganho' | 'gasto',
    color: c.color,
    created_at: new Date().toISOString(),
  }));
  localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`, JSON.stringify(defaultCats));
  return defaultCats;
};

export const saveStoredCategories = (userId: string, categories: Category[]) => {
  localStorage.setItem(`${STORAGE_KEYS.CATEGORIES}_${userId}`, JSON.stringify(categories));
};

export const getStoredTransactions = (userId: string): Transaction[] => {
  const raw = localStorage.getItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }

  // Seed sample transactions for current month demo
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  const sampleTx: Transaction[] = [
    {
      id: 'tx_1',
      user_id: userId,
      type: 'ganho',
      description: 'Salário Mensal',
      amount: 6500.0,
      category: 'Salário',
      date: `${y}-${m}-01`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_2',
      user_id: userId,
      type: 'ganho',
      description: 'Projeto Freelance Website',
      amount: 1800.0,
      category: 'Freelance',
      date: `${y}-${m}-08`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_3',
      user_id: userId,
      type: 'gasto',
      description: 'Supermercado Mensal',
      amount: 1250.40,
      category: 'Alimentação',
      date: `${y}-${m}-03`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_4',
      user_id: userId,
      type: 'gasto',
      description: 'Aluguel do Apê',
      amount: 2200.0,
      category: 'Moradia',
      date: `${y}-${m}-05`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_5',
      user_id: userId,
      type: 'gasto',
      description: 'Combustível Posto Shell',
      amount: 280.0,
      category: 'Transporte',
      date: `${y}-${m}-10`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_6',
      user_id: userId,
      type: 'gasto',
      description: 'Assinaturas (Netflix & Spotify)',
      amount: 79.90,
      category: 'Assinaturas',
      date: `${y}-${m}-12`,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx_7',
      user_id: userId,
      type: 'gasto',
      description: 'Jantar com Família',
      amount: 195.50,
      category: 'Alimentação',
      date: `${y}-${m}-15`,
      created_at: new Date().toISOString(),
    },
  ];

  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`, JSON.stringify(sampleTx));
  return sampleTx;
};

export const saveStoredTransactions = (userId: string, txs: Transaction[]) => {
  localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS}_${userId}`, JSON.stringify(txs));
};

export { getDemoUser, setDemoUser };
