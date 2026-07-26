import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Search,
  RefreshCw,
  Zap,
  Lock,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { useSubscription, PLANS } from '../hooks/use-subscription';
import { useAuth } from '../hooks/use-auth';
import { formatBRL, formatDateBR } from '../lib/format';
import { PlanType, UserSubscription } from '../types';
import { toast } from 'sonner';

interface AdminPageProps {
  onNavigate: (path: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const {
    allSubscriptions,
    extendUserTrial,
    grantUserSubscription,
    cancelUserSubscription,
    refreshSubscriptions,
  } = useSubscription(user);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'trial' | 'active' | 'expired'>('all');
  const [asaasConfig, setAsaasConfig] = useState<any>(null);

  // Load Asaas configuration status
  useEffect(() => {
    fetch('/api/asaas/config')
      .then((res) => res.json())
      .then((data) => setAsaasConfig(data))
      .catch((err) => console.error('Failed to fetch Asaas config:', err));
  }, []);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-4">
        <div className="p-4 w-14 h-14 mx-auto rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Esta área é exclusiva para administradores do sistema. Você não possui permissão para acessar o painel administrativo.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/dashboard')}
          className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // Filter user list
  const filteredUsers = allSubscriptions.filter((sub: UserSubscription) => {
    const matchesSearch =
      sub.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      (sub.userName && sub.userName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;

    const isSub = sub.status === 'active';
    const isExpired = sub.status === 'expired' || (sub.status === 'trial' && new Date(sub.trialExpiresAt).getTime() <= Date.now());
    const isTrial = sub.status === 'trial' && new Date(sub.trialExpiresAt).getTime() > Date.now();

    if (filterStatus === 'active') return isSub;
    if (filterStatus === 'trial') return isTrial;
    if (filterStatus === 'expired') return isExpired;

    return true;
  });

  // Calculate SaaS metrics
  const totalUsersCount = allSubscriptions.length;
  const activeSubsCount = allSubscriptions.filter((s: UserSubscription) => s.status === 'active').length;
  
  const activeTrialsCount = allSubscriptions.filter(
    (s: UserSubscription) => s.status === 'trial' && new Date(s.trialExpiresAt).getTime() > Date.now()
  ).length;

  const expiredTrialsCount = allSubscriptions.filter(
    (s: UserSubscription) => s.status === 'expired' || (s.status === 'trial' && new Date(s.trialExpiresAt).getTime() <= Date.now())
  ).length;

  // Estimated Monthly Recurring Revenue (MRR)
  const estimatedMRR = allSubscriptions.reduce((acc: number, s: UserSubscription) => {
    if (s.status !== 'active') return acc;
    const plan = PLANS.find((p) => p.id === s.planId);
    return acc + (plan?.monthlyEquivalent || 29.90);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/15 text-primary">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Painel Administrativo SaaS
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão de Usuários, Períodos de Degustação (36h), Assinaturas e Gateway Asaas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshSubscriptions}
            className="px-3 py-2 rounded-md border border-border bg-card text-foreground hover:bg-accent text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Atualizar Dados</span>
          </button>
        </div>
      </div>

      {/* Asaas Integration Status Banner */}
      <div className="p-4 rounded-xl bg-card border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${asaasConfig?.configured ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'}`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Integração Asaas</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${asaasConfig?.configured ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {asaasConfig?.configured ? 'Chave API Configurada' : 'Modo Simulação / Sandbox'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Endpoint: <code className="text-foreground">{asaasConfig?.apiUrl || 'https://sandbox.asaas.com/api/v3'}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/planos')}
            className="px-3.5 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Ver Tela de Planos</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase">
            <span>Total Cadastrados</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{totalUsersCount}</div>
          <p className="text-[11px] text-muted-foreground">Clientes na plataforma</p>
        </div>

        {/* Active Trials */}
        <div className="p-4 rounded-xl bg-card border border-amber-500/30 bg-amber-500/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-500 text-xs font-semibold uppercase">
            <span>Degustação Ativa (36h)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">{activeTrialsCount}</div>
          <p className="text-[11px] text-muted-foreground">Usuários testando agora</p>
        </div>

        {/* Expired Trials */}
        <div className="p-4 rounded-xl bg-card border border-destructive/30 bg-destructive/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-destructive text-xs font-semibold uppercase">
            <span>Degustação Expirada</span>
            <Lock className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-black text-destructive">{expiredTrialsCount}</div>
          <p className="text-[11px] text-muted-foreground">Aguardando assinatura</p>
        </div>

        {/* Active Subscriptions */}
        <div className="p-4 rounded-xl bg-card border border-emerald-500/30 bg-emerald-500/5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-500 text-xs font-semibold uppercase">
            <span>Assinantes VIP (MRR)</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">{activeSubsCount}</div>
          <p className="text-[11px] text-emerald-600 font-semibold">MRR Est: {formatBRL(estimatedMRR)}</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span>Controle de Acessos e Período de Teste</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Aumente o tempo de teste dos clientes ou ative a assinatura manualmente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar usuário por e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-background border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-background border border-border text-xs font-semibold"
            >
              <option value="all">Todos os Status</option>
              <option value="trial">Degustação Ativa</option>
              <option value="expired">Expirado</option>
              <option value="active">Assinante VIP</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-sm font-medium">Nenhum usuário encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Usuário</th>
                  <th className="py-3 px-3">Status do Acesso</th>
                  <th className="py-3 px-3">Início do Teste</th>
                  <th className="py-3 px-3">Expira Em</th>
                  <th className="py-3 px-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((sub: UserSubscription) => {
                  const isSub = sub.status === 'active';
                  const isExpired = sub.status === 'expired' || (sub.status === 'trial' && new Date(sub.trialExpiresAt).getTime() <= Date.now());
                  const isTrial = sub.status === 'trial' && new Date(sub.trialExpiresAt).getTime() > Date.now();

                  return (
                    <tr key={sub.userId} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">{sub.userName || 'Usuário'}</div>
                        <div className="text-[11px] text-muted-foreground">{sub.userEmail}</div>
                      </td>

                      <td className="py-3 px-3">
                        {isSub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold">
                            <Sparkles className="w-3 h-3" />
                            <span>Assinante ({sub.planId?.toUpperCase() || 'VIP'})</span>
                          </span>
                        ) : isTrial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Degustação Ativa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-destructive/15 border border-destructive/30 text-destructive font-bold">
                            <Lock className="w-3 h-3" />
                            <span>Teste Expirado</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        {formatDateBR(sub.trialStartedAt.split('T')[0])}
                      </td>

                      <td className="py-3 px-3 font-medium text-foreground">
                        {isSub ? 'Ilimitado (Assinante)' : formatDateBR(sub.trialExpiresAt.split('T')[0])}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => extendUserTrial(sub.userId, 24)}
                            className="px-2.5 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold transition-colors"
                            title="Adicionar +24 horas de teste grátis"
                          >
                            +24h Degustação
                          </button>

                          <button
                            type="button"
                            onClick={() => grantUserSubscription(sub.userId, 'annual')}
                            className="px-2.5 py-1 rounded bg-emerald-500 text-white font-bold hover:opacity-90 transition-opacity"
                            title="Ativar assinatura do Plano Anual"
                          >
                            Ativar VIP
                          </button>

                          <button
                            type="button"
                            onClick={() => cancelUserSubscription(sub.userId)}
                            className="px-2 py-1 rounded border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-semibold"
                            title="Bloquear/Cancelar acesso"
                          >
                            Bloquear
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
