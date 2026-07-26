import React, { useMemo, useState, useEffect } from 'react';
import { User, LogOut, Download, Receipt, TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle2, Target, Bell } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import { useTransactions } from '../hooks/use-finance-data';
import { formatBRL, formatDateBR, maskCurrencyInput, parseCurrencyToNumber } from '../lib/format';
import { useSettingsStore } from '../store/settings-store';
import { toast } from 'sonner';

interface ConfiguracoesPageProps {
  onLogout: () => void;
}

export const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ onLogout }) => {
  const { user, signOut } = useAuth();
  const { data: transactions = [] } = useTransactions(user?.id);
  const { monthlyBudgetLimit, setMonthlyBudgetLimit } = useSettingsStore();

  const [limitInput, setLimitInput] = useState(
    monthlyBudgetLimit > 0 ? formatBRL(monthlyBudgetLimit) : ''
  );

  useEffect(() => {
    if (monthlyBudgetLimit > 0) {
      setLimitInput(formatBRL(monthlyBudgetLimit));
    } else {
      setLimitInput('');
    }
  }, [monthlyBudgetLimit]);

  // Overall statistics accumulated
  const totalCount = transactions.length;

  const totalEarningsAccumulated = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'ganho')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [transactions]);

  const totalExpensesAccumulated = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'gasto')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [transactions]);

  // Expenses for the current calendar month
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions
      .filter((t) => {
        if (t.type !== 'gasto') return false;
        const d = new Date(`${t.date}T00:00:00`);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [transactions]);

  const percentUsed = monthlyBudgetLimit > 0 ? Math.min(100, (currentMonthExpenses / monthlyBudgetLimit) * 100) : 0;
  const isExceeded = monthlyBudgetLimit > 0 && currentMonthExpenses >= monthlyBudgetLimit;
  const isWarning = monthlyBudgetLimit > 0 && currentMonthExpenses >= monthlyBudgetLimit * 0.8 && !isExceeded;

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCurrencyToNumber(limitInput);
    setMonthlyBudgetLimit(parsed);
    if (parsed > 0) {
      toast.success(`Limite mensal definido para ${formatBRL(parsed)}!`);
    } else {
      toast.info('Limite de gastos removido.');
    }
  };

  const handleRemoveLimit = () => {
    setMonthlyBudgetLimit(0);
    setLimitInput('');
    toast.info('Limite de gastos desativado.');
  };

  // Generate and download CSV in Brazilian format
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Nenhum lançamento para exportar.');
      return;
    }

    // CSV Header with semicolon separator
    const headers = 'Data;Tipo;Descrição;Categoria;Valor (R$)\n';

    // CSV Rows
    const rows = transactions
      .map((t) => {
        const formattedDate = formatDateBR(t.date);
        const formattedAmount = Number(t.amount).toFixed(2).replace('.', ',');
        const cleanDesc = t.description.replace(/;/g, ',');
        const cleanCat = t.category.replace(/;/g, ',');
        return `${formattedDate};${t.type};${cleanDesc};${cleanCat};${formattedAmount}`;
      })
      .join('\n');

    // BOM for UTF-8 in Excel
    const csvContent = '\uFEFF' + headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sistema_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Arquivo CSV exportado com sucesso!');
  };

  const handleSignOut = async () => {
    await signOut();
    onLogout();
  };

  const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-6 max-w-4xl" id="configuracoes-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu perfil, veja estatísticas gerais e exporte seus dados.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 rounded-md bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary text-primary text-xl font-bold flex items-center justify-center flex-shrink-0">
            {emailInitial}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {user?.user_metadata?.full_name || 'Usuário do Sistema'}
            </h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <User className="w-3.5 h-3.5" />
              <span>{user?.email || 'email@exemplo.com.br'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-success/15 text-success text-xs font-semibold flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Sessão Ativa
          </span>
        </div>
      </div>

      {/* Monthly Budget Limit Configuration Section */}
      <div className="p-6 rounded-md bg-card border border-border shadow-xs space-y-5" id="budget-limit-settings-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Teto e Limite de Gastos Mensais</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defina um valor máximo de despesas para o mês. O sistema alterará o visual e emitirá alertas caso você ultrapasse.
            </p>
          </div>
          {monthlyBudgetLimit > 0 && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
                isExceeded
                  ? 'bg-destructive/15 text-destructive border border-destructive/30'
                  : isWarning
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'bg-success/15 text-success border border-success/30'
              }`}
            >
              {isExceeded ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Limite Excedido</span>
                </>
              ) : isWarning ? (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Alerta (80%+)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dentro do Limite</span>
                </>
              )}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveLimit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="budget-limit-input" className="text-xs font-semibold text-foreground">
                Limite de Gastos Mensal (R$)
              </label>
              <input
                id="budget-limit-input"
                type="text"
                placeholder="Ex: R$ 3.500,00"
                value={limitInput}
                onChange={(e) => setLimitInput(maskCurrencyInput(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                id="save-budget-limit-btn"
                type="submit"
                className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                Salvar Limite
              </button>
              {monthlyBudgetLimit > 0 && (
                <button
                  id="remove-budget-limit-btn"
                  type="button"
                  onClick={handleRemoveLimit}
                  className="px-3 py-2 rounded-md border border-border hover:bg-accent text-xs font-semibold text-muted-foreground"
                >
                  Desativar
                </button>
              )}
            </div>
          </div>
        </form>

        {monthlyBudgetLimit > 0 && (
          <div className="pt-2 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Gastos deste mês vs Teto definido:</span>
              <span className="font-bold text-foreground">
                {formatBRL(currentMonthExpenses)} de {formatBRL(monthlyBudgetLimit)} ({((currentMonthExpenses / monthlyBudgetLimit) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-accent h-2.5 rounded-full overflow-hidden border border-border/40">
              <div
                className={`h-full transition-all duration-300 ${
                  isExceeded
                    ? 'bg-destructive'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-success'
                }`}
                style={{ width: `${percentUsed}%` }}
              ></div>
            </div>
            {isExceeded && (
              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  Você ultrapassou o limite do mês em {formatBRL(currentMonthExpenses - monthlyBudgetLimit)}!
                </span>
              </p>
            )}
            {isWarning && (
              <p className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mt-1">
                <Bell className="w-3.5 h-3.5" />
                <span>Atenção: Você atingiu 80%+ do teto mensal estabelecido.</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Account General Statistics */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Estatísticas Acumuladas da Conta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-card border border-border shadow-xs space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" /> Total de Lançamentos
            </span>
            <div className="text-xl font-bold text-foreground">{totalCount}</div>
          </div>

          <div className="p-4 rounded-md bg-card border border-border shadow-xs space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-success" /> Total Ganho Acumulado
            </span>
            <div className="text-xl font-bold text-success">{formatBRL(totalEarningsAccumulated)}</div>
          </div>

          <div className="p-4 rounded-md bg-card border border-border shadow-xs space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-destructive" /> Total Gasto Acumulado
            </span>
            <div className="text-xl font-bold text-destructive">{formatBRL(totalExpensesAccumulated)}</div>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="p-6 rounded-md bg-card border border-border shadow-xs space-y-6">
        <h2 className="text-base font-bold text-foreground">Ações da Conta</h2>

        <div className="divide-y divide-border">
          {/* Export CSV Row */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Exportar Dados em CSV</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Baixe todas as suas transações em arquivo formatado para Excel/Planilhas (separador `;`, moeda brasileira).
              </p>
            </div>
            <button
              id="export-csv-btn"
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-md border border-border bg-background hover:bg-accent text-foreground text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Logout Row */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Sair da Conta</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Encerra sua sessão atual com segurança neste navegador.
              </p>
            </div>
            <button
              id="logout-btn"
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
