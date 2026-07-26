import React, { useState } from 'react';
import { Check, Zap, Shield, CreditCard, QrCode, FileText, ArrowRight, Sparkles, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { PLANS } from '../hooks/use-subscription';
import { useSubscription } from '../hooks/use-subscription';
import { useAuth } from '../hooks/use-auth';
import { formatBRL } from '../lib/format';
import { PlanType } from '../types';
import { toast } from 'sonner';

interface PlanosPageProps {
  onNavigate?: (path: string) => void;
  isPaywallModal?: boolean;
}

export const PlanosPage: React.FC<PlanosPageProps> = ({ onNavigate, isPaywallModal = false }) => {
  const { user } = useAuth();
  const { subscription, isSubscribed, isTrialActive, isTrialExpired, timeLeftFormatted, processSubscriptionPayment } = useSubscription(user);

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [billingMethod, setBillingMethod] = useState<'PIX' | 'CREDIT_CARD' | 'BOLETO'>('PIX');
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const plan = PLANS.find((p) => p.id === selectedPlan) || PLANS[2];

  const handleSubscribe = async () => {
    setLoading(true);
    setPaymentResult(null);

    const result = await processSubscriptionPayment(selectedPlan, billingMethod);
    setLoading(false);

    if (result.success) {
      if (result.payment?.pixQrCode) {
        setPaymentResult(result.payment);
      } else {
        toast.success('Assinatura ativada com sucesso!');
        if (onNavigate) {
          onNavigate('/dashboard');
        }
      }
    }
  };

  return (
    <div className={`space-y-8 ${isPaywallModal ? 'p-2' : 'max-w-6xl mx-auto py-4'}`}>
      {/* Top Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        {isTrialExpired ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            <span>Sua degustação de 36 horas expirou!</span>
          </div>
        ) : isTrialActive ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Período de Degustação Ativo: {timeLeftFormatted} restantes</span>
          </div>
        ) : isSubscribed ? (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-success/15 border border-success/30 text-success text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Você é um assinante VIP ativo!</span>
          </div>
        ) : null}

        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Planos e Assinatura SaaS
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie suas finanças com inteligência e controle total. Escolha o plano ideal para continuar utilizando o sistema sem interrupções.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const isSelected = selectedPlan === p.id;
          const isAnnual = p.id === 'annual';

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={`relative rounded-xl border p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 bg-card ${
                isSelected
                  ? 'border-2 border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02]'
                  : 'border-border hover:border-primary/50 shadow-xs'
              }`}
            >
              {p.savingsBadge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{p.savingsBadge}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="mt-4 mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-foreground">{formatBRL(p.price)}</span>
                    <span className="text-xs text-muted-foreground font-semibold">{p.periodLabel}</span>
                  </div>
                  {p.monthlyEquivalent < p.price && (
                    <p className="text-xs text-emerald-500 font-semibold mt-0.5">
                      Equivale a apenas {formatBRL(p.monthlyEquivalent)}/mês
                    </p>
                  )}
                </div>

                <div className="my-4 border-t border-border pt-4">
                  <ul className="space-y-2.5">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-foreground/90">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(p.id);
                  }}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-md hover:opacity-90'
                      : 'border border-border text-foreground hover:bg-accent'
                  }`}
                >
                  {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Payment Box */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-md max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Forma de Pagamento (Asaas)</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Pagamento processado com segurança via gateway Asaas.
            </p>
          </div>
          <span className="text-sm font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-md">
            {plan.name}: {formatBRL(plan.price)}
          </span>
        </div>

        {/* Payment Method Tabs */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setBillingMethod('PIX')}
            className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              billingMethod === 'PIX'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span>PIX (Aprovação Instantânea)</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingMethod('CREDIT_CARD')}
            className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              billingMethod === 'CREDIT_CARD'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>Cartão de Crédito</span>
          </button>

          <button
            type="button"
            onClick={() => setBillingMethod('BOLETO')}
            className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
              billingMethod === 'BOLETO'
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Boleto Bancário</span>
          </button>
        </div>

        {/* Payment Details / Simulation */}
        {paymentResult?.pixQrCode ? (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <h4 className="text-sm font-bold text-emerald-500 flex items-center justify-center gap-1.5">
              <QrCode className="w-4 h-4" />
              <span>Copie e Cole o Código PIX abaixo</span>
            </h4>
            <div className="p-3 bg-background border border-border rounded text-[11px] font-mono break-all select-all text-muted-foreground">
              {paymentResult.pixQrCode.payload}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(paymentResult.pixQrCode.payload);
                toast.success('Código PIX copiado!');
              }}
              className="px-4 py-2 rounded-md bg-emerald-500 text-white text-xs font-bold hover:opacity-90"
            >
              Copiar Código PIX
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-extrabold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Processando Assinatura Asaas...</span>
              ) : (
                <>
                  <span>Assinar {plan.name} por {formatBRL(plan.price)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Pagamento Seguro via Gateway Asaas • Cancelamento simples a qualquer momento</span>
        </div>
      </div>
    </div>
  );
};
