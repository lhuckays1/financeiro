import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus, AlertTriangle, Bell, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Sector } from 'recharts';
import { PeriodSelector } from '../components/PeriodSelector';
import { usePeriodStore } from '../store/period-store';
import { useAuth } from '../hooks/use-auth';
import { useTransactions, useCategories } from '../hooks/use-finance-data';
import { formatBRL, formatDateBR } from '../lib/format';
import { getPreviousPeriod, calculateDelta, getDaysInPeriod, formatDateKey, formatDateDisplayShort } from '../lib/period';
import { useTransactionModalStore } from '../store/transaction-modal-store';
import { useSettingsStore } from '../store/settings-store';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { getRange } = usePeriodStore();
  const { openModal } = useTransactionModalStore();
  const { monthlyBudgetLimit } = useSettingsStore();

  const { data: transactions = [] } = useTransactions(user?.id);
  const { data: categories = [] } = useCategories(user?.id);

  const range = getRange();
  const prevPeriod = getPreviousPeriod(range.from, range.to);

  // Filter current period transactions
  const currentPeriodTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(`${t.date}T00:00:00`);
      return d >= range.from && d <= range.to;
    });
  }, [transactions, range]);

  // Calendar month expenses (for budget limit comparison)
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

  const budgetRatio = monthlyBudgetLimit > 0 ? (currentMonthExpenses / monthlyBudgetLimit) * 100 : 0;
  const isBudgetExceeded = monthlyBudgetLimit > 0 && currentMonthExpenses >= monthlyBudgetLimit;
  const isBudgetWarning = monthlyBudgetLimit > 0 && currentMonthExpenses >= monthlyBudgetLimit * 0.8 && !isBudgetExceeded;

  // Filter previous period transactions
  const prevPeriodTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(`${t.date}T00:00:00`);
      return d >= prevPeriod.from && d <= prevPeriod.to;
    });
  }, [transactions, prevPeriod]);

  // Totals current period
  const totalGanhos = useMemo(() => {
    return currentPeriodTx
      .filter((t) => t.type === 'ganho')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [currentPeriodTx]);

  const totalGastos = useMemo(() => {
    return currentPeriodTx
      .filter((t) => t.type === 'gasto')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [currentPeriodTx]);

  const saldo = totalGanhos - totalGastos;

  // Totals previous period
  const prevGanhos = useMemo(() => {
    return prevPeriodTx
      .filter((t) => t.type === 'ganho')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [prevPeriodTx]);

  const prevGastos = useMemo(() => {
    return prevPeriodTx
      .filter((t) => t.type === 'gasto')
      .reduce((acc, t) => acc + Number(t.amount), 0);
  }, [prevPeriodTx]);

  const deltaGanhos = calculateDelta(totalGanhos, prevGanhos);
  const deltaGastos = calculateDelta(totalGastos, prevGastos);

  // Bar Chart Data: Daily Ganhos vs Gastos
  const barChartData = useMemo(() => {
    const days = getDaysInPeriod(range.from, range.to);

    // Group by day key 'YYYY-MM-DD'
    const dayMap = new Map<string, { dateStr: string; label: string; ganho: number; gasto: number }>();

    days.forEach((d) => {
      const key = formatDateKey(d);
      dayMap.set(key, {
        dateStr: key,
        label: formatDateDisplayShort(d),
        ganho: 0,
        gasto: 0,
      });
    });

    currentPeriodTx.forEach((t) => {
      const key = t.date;
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        if (t.type === 'ganho') {
          item.ganho += Number(t.amount);
        } else {
          item.gasto += Number(t.amount);
        }
      }
    });

    return Array.from(dayMap.values());
  }, [currentPeriodTx, range]);

  // Pie Chart Data: Expenses by Category
  const pieChartData = useMemo(() => {
    const expenses = currentPeriodTx.filter((t) => t.type === 'gasto');
    const categoryTotals = new Map<string, number>();

    expenses.forEach((t) => {
      const cur = categoryTotals.get(t.category) || 0;
      categoryTotals.set(t.category, cur + Number(t.amount));
    });

    const categoryColorMap = new Map<string, string>();
    categories.forEach((c) => {
      categoryColorMap.set(c.name, c.color);
    });

    return Array.from(categoryTotals.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColorMap.get(name) || '#64748B',
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentPeriodTx, categories]);

  // Latest 5 transactions
  const latestTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Custom active shape for Pie to disable hover scaling/animation
  const renderStaticSector = (props: any) => {
    return <Sector {...props} />;
  };

  return (
    <div className="space-y-6" id="dashboard-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe a movimentação financeira no período selecionado.
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Monthly Expense Budget Notification Banner */}
      {isBudgetExceeded && (
        <div className="p-4 rounded-md bg-destructive/15 border-2 border-destructive/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-destructive shadow-lg animate-in fade-in" id="budget-exceeded-alert-banner">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/25 border border-destructive/40 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Alerta de Orçamento: Gastos do mês excederam o teto!</h3>
              <p className="text-xs text-foreground/90 mt-0.5">
                Os gastos deste mês (<strong className="text-destructive font-bold">{formatBRL(currentMonthExpenses)}</strong>) ultrapassaram o limite configurado de{' '}
                <strong>{formatBRL(monthlyBudgetLimit)}</strong> em <strong className="text-destructive font-extrabold">{formatBRL(currentMonthExpenses - monthlyBudgetLimit)}</strong> ({budgetRatio.toFixed(1)}%).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/configuracoes')}
            className="px-3 py-1.5 rounded bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 flex-shrink-0"
          >
            Ajustar Limite
          </button>
        </div>
      )}

      {!isBudgetExceeded && isBudgetWarning && (
        <div className="p-4 rounded-md bg-amber-500/15 border-2 border-amber-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-500 shadow-md animate-in fade-in" id="budget-warning-alert-banner">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-amber-500/25 border border-amber-500/40 flex-shrink-0">
              <Bell className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">Aviso de Orçamento: Gastos próximos do limite</h3>
              <p className="text-xs text-foreground/90 mt-0.5">
                Você já utilizou <strong className="text-amber-500 font-bold">{budgetRatio.toFixed(1)}%</strong> do seu teto mensal ({formatBRL(currentMonthExpenses)} de {formatBRL(monthlyBudgetLimit)}).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/configuracoes')}
            className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 flex-shrink-0"
          >
            Ver Detalhes
          </button>
        </div>
      )}

      {/* 3 StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* StatCard 1: Ganhos */}
        <div id="stat-card-ganhos" className="p-5 rounded-md bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Entradas (Ganhos)
            </span>
            <div className="p-2 rounded-md bg-success/15 text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-success tracking-tight">
              {formatBRL(totalGanhos)}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {deltaGanhos >= 0 ? (
                <span className="text-success font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />+{deltaGanhos.toFixed(1)}%
                </span>
              ) : (
                <span className="text-destructive font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />{deltaGanhos.toFixed(1)}%
                </span>
              )}
              <span>vs. período anterior</span>
            </div>
          </div>
        </div>

        {/* StatCard 2: Gastos */}
        <div
          id="stat-card-gastos"
          className={`p-5 rounded-md bg-card border shadow-xs space-y-3 transition-colors ${
            isBudgetExceeded
              ? 'border-destructive/80 bg-destructive/10'
              : isBudgetWarning
              ? 'border-amber-500/80 bg-amber-500/5'
              : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>Saídas (Gastos)</span>
            </span>
            <div
              className={`p-2 rounded-md ${
                isBudgetExceeded
                  ? 'bg-destructive text-destructive-foreground animate-pulse'
                  : isBudgetWarning
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-destructive/15 text-destructive'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-extrabold tracking-tight ${
                isBudgetExceeded
                  ? 'text-destructive font-black'
                  : isBudgetWarning
                  ? 'text-amber-500'
                  : 'text-destructive'
              }`}
            >
              {formatBRL(totalGastos)}
            </div>
            <div className="flex items-center justify-between gap-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center">
                {deltaGastos <= 0 ? (
                  <span className="text-success font-semibold flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5" />{deltaGastos.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-destructive font-semibold flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5" />+{deltaGastos.toFixed(1)}%
                  </span>
                )}
                <span className="ml-1">vs. anterior</span>
              </span>

              {monthlyBudgetLimit > 0 && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isBudgetExceeded
                      ? 'bg-destructive/20 text-destructive border border-destructive/40'
                      : isBudgetWarning
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-accent text-muted-foreground'
                  }`}
                >
                  {budgetRatio.toFixed(0)}% do Teto
                </span>
              )}
            </div>

            {monthlyBudgetLimit > 0 && (
              <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Limite do Mês:</span>
                  <span className="font-semibold text-foreground">{formatBRL(monthlyBudgetLimit)}</span>
                </div>
                <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isBudgetExceeded ? 'bg-destructive' : isBudgetWarning ? 'bg-amber-500' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min(100, budgetRatio)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* StatCard 3: Saldo */}
        <div
          id="stat-card-saldo"
          className={`p-5 rounded-md bg-card border shadow-xs space-y-3 transition-colors ${
            isBudgetExceeded
              ? 'border-destructive/40 bg-destructive/5'
              : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Saldo Restante
            </span>
            <div
              className={`p-2 rounded-md ${
                isBudgetExceeded
                  ? 'bg-destructive/20 text-destructive'
                  : 'bg-primary/15 text-primary'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-extrabold tracking-tight ${
                isBudgetExceeded
                  ? 'text-destructive'
                  : saldo >= 0
                  ? 'text-primary'
                  : 'text-destructive'
              }`}
            >
              {formatBRL(saldo)}
            </div>
            <p
              className={`text-xs mt-1 font-medium ${
                isBudgetExceeded
                  ? 'text-destructive font-semibold flex items-center gap-1'
                  : 'text-muted-foreground'
              }`}
            >
              {isBudgetExceeded ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Limite mensal de gastos ultrapassado!</span>
                </>
              ) : saldo >= 0 ? (
                'Resultado positivo no período'
              ) : (
                'Atenção: despesas superam receitas'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Ganhos vs Gastos (2 cols on lg) */}
        <div className="lg:col-span-2 p-5 rounded-md bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Ganhos vs. Gastos</h2>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-success">
                <span className="w-3 h-3 rounded-xs bg-success"></span>
                Ganhos
              </span>
              <span className="flex items-center gap-1.5 text-destructive">
                <span className="w-3 h-3 rounded-xs bg-destructive"></span>
                Gastos
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} cursor={false} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `R$${v}`}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.375rem',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      formatBRL(Number(value) || 0),
                      name === 'ganho' ? 'Ganho' : 'Gasto',
                    ]}
                  />
                  <Bar
                    dataKey="ganho"
                    fill="var(--success)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="gasto"
                    fill="var(--destructive)"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Nenhum lançamento no período para exibir no gráfico.
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart: Gastos por Categoria (1 col on lg) */}
        <div className="p-5 rounded-md bg-card border border-border shadow-xs space-y-4">
          <h2 className="text-base font-bold text-foreground">Gastos por Categoria</h2>

          <div className="h-52 w-full flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                    activeShape={renderStaticSector}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.375rem',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatBRL(Number(value) || 0), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Sem despesas registradas no período.
              </div>
            )}
          </div>

          {/* Category legend list */}
          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {pieChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span className="text-foreground truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground ml-2">{formatBRL(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest 5 Transactions List */}
      <div className="p-5 rounded-md bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Últimos Lançamentos</h2>
          <button
            id="view-all-transactions-btn"
            type="button"
            onClick={() => onNavigate('/lancamentos')}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todos &rarr;
          </button>
        </div>

        {latestTransactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground space-y-3">
            <p>Você ainda não possui lançamentos cadastrados.</p>
            <button
              type="button"
              onClick={() => openModal(null, 'gasto')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Criar primeiro lançamento</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {latestTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => openModal(tx)}
                className="py-3 flex items-center justify-between hover:bg-accent/40 rounded-md px-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      tx.type === 'ganho' ? 'bg-success' : 'bg-destructive'
                    }`}
                  ></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDateBR(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`text-sm font-bold ${
                    tx.type === 'ganho' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {tx.type === 'ganho' ? '+' : '-'} {formatBRL(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
