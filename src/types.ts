export type TransactionType = 'ganho' | 'gasto';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string;
  created_at?: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: TransactionType;
    category: string;
    account_id?: string;
    amount: number;
    description: string;
    date: string;
    created_at?: string;
}

export type PeriodPreset = 'today' | 'this_week' | 'this_month' | 'last_3_months' | 'this_year' | 'custom';

export interface PeriodRange {
  preset: PeriodPreset;
  from: Date;
  to: Date;
  label: string;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    is_admin?: boolean;
    role?: string;
  };
}

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'canceled';
export type PlanType = 'monthly' | 'quarterly' | 'annual';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  periodLabel: string;
  monthlyEquivalent: number;
  savingsBadge?: string;
  features: string[];
}

export interface UserSubscription {
  userId: string;
  userEmail: string;
  userName?: string;
  status: SubscriptionStatus;
  planId?: PlanType;
  trialStartedAt: string; // ISO string
  trialExpiresAt: string; // ISO string
  subscriptionExpiresAt?: string; // ISO string
  asaasCustomerId?: string;
  asaasPaymentId?: string;
  updatedAt: string;
}

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: TransactionType;
    color: string;

    oldName?: string;

    created_at?: string;
}

export type AccountType =
  | "Conta Corrente"
  | "Conta Poupança"
  | "Conta Digital"
  | "Carteira"
  | "Dinheiro"
  | "Investimento";

export interface Account {
  id: string;
  user_id: string;

  name: string;

  type: AccountType;

  color: string;

  initial_balance: number;

  is_active: boolean;

  created_at?: string;

  updated_at?: string;
}

