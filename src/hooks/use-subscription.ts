import { useState, useEffect, useCallback } from 'react';
import { AuthUser, Plan, UserSubscription, SubscriptionStatus, PlanType } from '../types';
import { toast } from 'sonner';

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 29.90,
    periodLabel: '/mês',
    monthlyEquivalent: 29.90,
    features: [
      'Acesso completo a todas as funcionalidades',
      'Lançamentos e categorias ilimitadas',
      'Relatórios e gráficos avançados',
      'Exportação de dados em CSV/PDF',
      'Suporte prioritário',
    ],
  },
  {
    id: 'quarterly',
    name: 'Plano Trimestral',
    price: 79.90,
    periodLabel: '/trimestre',
    monthlyEquivalent: 26.63,
    savingsBadge: 'Economia de 11%',
    features: [
      'Tudo do Plano Mensal',
      'Cobrança a cada 3 meses',
      'Economize R$ 9,80 por trimestre',
      'Suporte VIP via WhatsApp',
    ],
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    price: 269.90,
    periodLabel: '/ano',
    monthlyEquivalent: 22.49,
    savingsBadge: 'Mais Popular - 25% OFF',
    features: [
      'Tudo do Plano Trimestral',
      'Cobrança única anual',
      'Economize R$ 88,90 por ano',
      'Consultoria inicial de boas-vindas',
      'Prioridade em novas atualizações',
    ],
  },
];

const SUBSCRIPTIONS_KEY = 'saas_finance_user_subscriptions_v1';
const TRIAL_HOURS = 36;

function getStoredSubscriptions(): Record<string, UserSubscription> {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSubscriptions(subs: Record<string, UserSubscription>) {
  try {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subs));
  } catch (err) {
    console.error('Failed to save subscriptions:', err);
  }
}

export function useSubscription(user: AuthUser | null) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [allSubs, setAllSubs] = useState<Record<string, UserSubscription>>({});
  const [now, setNow] = useState<number>(Date.now());

  // Timer to update remaining trial seconds live
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize or get subscription for current user
  const loadUserSubscription = useCallback(() => {
    if (!user) {
      setSubscription(null);
      return;
    }

    const subs = getStoredSubscriptions();
    setAllSubs(subs);

    let userSub = subs[user.id];

    if (!userSub) {
      // First time user registration - assign 36 hour trial
      const startTime = user.created_at ? new Date(user.created_at).getTime() : Date.now();
      const trialStartISO = new Date(startTime).toISOString();
      const trialExpireISO = new Date(startTime + TRIAL_HOURS * 3600 * 1000).toISOString();

      userSub = {
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.full_name || user.email.split('@')[0],
        status: 'trial',
        trialStartedAt: trialStartISO,
        trialExpiresAt: trialExpireISO,
        updatedAt: new Date().toISOString(),
      };

      subs[user.id] = userSub;
      saveStoredSubscriptions(subs);
    }

    setSubscription(userSub);
  }, [user]);

  useEffect(() => {
    loadUserSubscription();
  }, [loadUserSubscription]);

  // Derived state calculations
  const isSubscribed = subscription?.status === 'active';
  
  const trialExpiresMs = subscription?.trialExpiresAt
    ? new Date(subscription.trialExpiresAt).getTime()
    : 0;

  const msRemaining = Math.max(0, trialExpiresMs - now);
  const isTrialActive = !isSubscribed && msRemaining > 0 && subscription?.status !== 'canceled';
  const isTrialExpired = !isSubscribed && msRemaining <= 0;

  // Format time remaining for display (e.g. "28h 15m 30s")
  const formatTimeLeft = () => {
    if (isSubscribed) return 'Assinatura Ativa';
    if (msRemaining <= 0) return 'Expirado';

    const totalSeconds = Math.floor(msRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours >= 1) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Process Subscription via Asaas or Direct activation
  const processSubscriptionPayment = async (planId: PlanType, billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO') => {
    if (!user || !subscription) return { success: false, message: 'Usuário não autenticado' };

    try {
      const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

      // 1. Create Asaas customer
      const custResp = await fetch('/api/asaas/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.user_metadata?.full_name || user.email.split('@')[0],
          email: user.email,
        }),
      });
      const custData = await custResp.json();

      // 2. Create Asaas payment
      const payResp = await fetch('/api/asaas/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: custData.id || `cus_${user.id}`,
          value: plan.price,
          billingType,
          description: `Assinatura SaaS - ${plan.name}`,
          planId,
          email: user.email,
        }),
      });
      const payData = await payResp.json();

      if (!payData.success) {
        toast.error('Erro ao gerar cobrança no Asaas');
        return { success: false, error: payData.error };
      }

      // If mock payment or auto-confirm, activate subscription immediately
      if (payData.isMock || billingType === 'PIX') {
        const subs = getStoredSubscriptions();
        const durationDays = planId === 'annual' ? 365 : planId === 'quarterly' ? 90 : 30;
        
        const updatedSub: UserSubscription = {
          ...subscription,
          status: 'active',
          planId,
          asaasCustomerId: custData.id,
          asaasPaymentId: payData.id,
          subscriptionExpiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        subs[user.id] = updatedSub;
        saveStoredSubscriptions(subs);
        setSubscription(updatedSub);
        setAllSubs(subs);

        toast.success(`Assinatura do ${plan.name} ativada com sucesso!`);
      }

      return {
        success: true,
        payment: payData,
        isMock: payData.isMock,
      };
    } catch (err: any) {
      console.error('Subscription error:', err);
      toast.error('Ocorreu uma falha ao processar a assinatura.');
      return { success: false, message: err.message };
    }
  };

  // Admin Function: Extend user trial by specified hours
  const extendUserTrial = (targetUserId: string, extraHours: number) => {
    const subs = getStoredSubscriptions();
    const targetSub = subs[targetUserId];
    if (!targetSub) {
      toast.error('Usuário não encontrado nas assinaturas.');
      return;
    }

    const currentExpire = new Date(targetSub.trialExpiresAt).getTime();
    const baseTime = currentExpire > Date.now() ? currentExpire : Date.now();
    const newExpireISO = new Date(baseTime + extraHours * 3600 * 1000).toISOString();

    const updated: UserSubscription = {
      ...targetSub,
      status: 'trial',
      trialExpiresAt: newExpireISO,
      updatedAt: new Date().toISOString(),
    };

    subs[targetUserId] = updated;
    saveStoredSubscriptions(subs);
    setAllSubs(subs);

    if (user?.id === targetUserId) {
      setSubscription(updated);
    }

    toast.success(`Degustação de ${targetSub.userEmail} estendida em +${extraHours} horas!`);
  };

  // Admin Function: Grant subscription to a user
  const grantUserSubscription = (targetUserId: string, planId: PlanType) => {
    const subs = getStoredSubscriptions();
    const targetSub = subs[targetUserId];
    const userEmail = targetSub?.userEmail || 'usuário';

    const durationDays = planId === 'annual' ? 365 : planId === 'quarterly' ? 90 : 30;

    const updated: UserSubscription = {
      ...(targetSub || {
        userId: targetUserId,
        userEmail,
        trialStartedAt: new Date().toISOString(),
        trialExpiresAt: new Date().toISOString(),
      }),
      status: 'active',
      planId,
      subscriptionExpiresAt: new Date(Date.now() + durationDays * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    subs[targetUserId] = updated;
    saveStoredSubscriptions(subs);
    setAllSubs(subs);

    if (user?.id === targetUserId) {
      setSubscription(updated);
    }

    toast.success(`Assinatura ativada manualmente para ${userEmail}!`);
  };

  // Admin Function: Cancel subscription / expire user trial
  const cancelUserSubscription = (targetUserId: string) => {
    const subs = getStoredSubscriptions();
    const targetSub = subs[targetUserId];
    if (!targetSub) return;

    const updated: UserSubscription = {
      ...targetSub,
      status: 'expired',
      trialExpiresAt: new Date(Date.now() - 1000).toISOString(), // set in the past
      updatedAt: new Date().toISOString(),
    };

    subs[targetUserId] = updated;
    saveStoredSubscriptions(subs);
    setAllSubs(subs);

    if (user?.id === targetUserId) {
      setSubscription(updated);
    }

    toast.info(`Assinatura/degustação de ${targetSub.userEmail} cancelada.`);
  };

  return {
    subscription,
    allSubscriptions: (Object.values(allSubs) as UserSubscription[]),
    isSubscribed,
    isTrialActive,
    isTrialExpired,
    msRemaining,
    timeLeftFormatted: formatTimeLeft(),
    processSubscriptionPayment,
    extendUserTrial,
    grantUserSubscription,
    cancelUserSubscription,
    refreshSubscriptions: loadUserSubscription,
  };
}
