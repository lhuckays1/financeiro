import React, { useMemo, useState } from 'react';
import { Check, Plus, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/use-auth';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/use-finance-data';
import { useCreatePayable, useCreditCards, usePayables, usePayPayable } from '../hooks/use-payables';
import { formatBRL, formatDateBR } from '../lib/format';
import { Payable } from '../types';

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const ContasAPagarPage: React.FC = () => {
  const { user } = useAuth();
  const { data: payables = [], isLoading } = usePayables(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);
  const { data: cards = [] } = useCreditCards(user?.id);
  const { data: categories = [] } = useCategories(user?.id);
  const createPayable = useCreatePayable(user?.id);
  const payMutation = usePayPayable(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Outros');
  const [dueDate, setDueDate] = useState(localDate());
  const [purchaseDate, setPurchaseDate] = useState(localDate());
  const [accountId, setAccountId] = useState('');
  const expenseCategories = categories.filter((item) => item.type === 'gasto');
  const selectedAccountId = accountId || accounts.find((account) => account.is_active)?.id || accounts[0]?.id || '';

  const totals = useMemo(() => {
    const pending = payables.filter((item) => item.status === 'pending');
    const today = localDate();
    return {
      amount: pending.reduce((sum, item) => sum + Number(item.amount), 0),
      overdue: pending.filter((item) => item.due_date < today).length,
      count: pending.length,
    };
  }, [payables]);

  const visible = payables.filter((item) => filter === 'all' || item.status === filter);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || Number(amount) <= 0 || !dueDate) return toast.error('Preencha a descrição, o valor e o vencimento.');
    await createPayable.mutateAsync({ title: title.trim(), amount: Number(amount), category: category || 'Outros', due_date: dueDate, purchase_date: purchaseDate });
    setTitle(''); setAmount(''); setDueDate(localDate()); setPurchaseDate(localDate()); setShowForm(false);
  };

  const markPaid = async (payable: Payable) => {
    if (!selectedAccountId) return toast.error('Cadastre uma conta para registrar o pagamento.');
    await payMutation.mutateAsync({ payable, accountId: selectedAccountId });
  };

  return <div className="space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Contas a pagar</h1><p className="text-sm text-muted-foreground">Acompanhe despesas, parcelas e vencimentos.</p></div>
      <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus size={16}/> Nova conta</button>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Em aberto</p><p className="mt-1 text-xl font-bold">{formatBRL(totals.amount)}</p></div>
      <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Obrigações pendentes</p><p className="mt-1 text-xl font-bold">{totals.count}</p></div>
      <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Vencidas</p><p className="mt-1 text-xl font-bold text-destructive">{totals.overdue}</p></div>
    </div>

    {showForm && <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 rounded-lg border border-border bg-card p-4">
      <label className="space-y-1 text-xs">Descrição<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: aluguel, energia…" className="w-full rounded border border-border bg-background px-3 py-2 text-sm"/></label>
      <label className="space-y-1 text-xs">Valor (R$)<input required type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm"/></label>
      <label className="space-y-1 text-xs">Categoria<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">{expenseCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}{!expenseCategories.some((item) => item.name === 'Outros') && <option value="Outros">Outros</option>}</select></label>
      <label className="space-y-1 text-xs">Data da despesa<input required type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm"/></label>
      <div className="flex items-end gap-2"><label className="flex-1 space-y-1 text-xs">Vencimento<input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm"/></label><button disabled={createPayable.isPending} className="rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Salvar</button></div>
    </form>}

    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-semibold">Obrigações</h2><div className="flex items-center gap-2"><label className="text-xs text-muted-foreground" htmlFor="pay-account">Pagar pela conta</label><select id="pay-account" value={selectedAccountId} onChange={(e) => setAccountId(e.target.value)} className="max-w-52 rounded border border-border bg-background px-2 py-1.5 text-xs">{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded border border-border bg-background px-2 py-1.5 text-xs"><option value="pending">Em aberto</option><option value="paid">Pagas</option><option value="all">Todas</option></select></div></div>
      {isLoading ? <p className="p-10 text-center text-sm text-muted-foreground">Carregando contas a pagar…</p> : visible.length === 0 ? <div className="p-10 text-center"><ReceiptText className="mx-auto mb-3 text-muted-foreground"/><p className="font-medium">Nenhuma obrigação neste filtro.</p><p className="mt-1 text-xs text-muted-foreground">Contas cadastradas e parcelas dos cartões aparecem nesta lista.</p></div> : <div className="divide-y divide-border">{visible.map((item) => {
        const overdue = item.status === 'pending' && item.due_date < localDate();
        const card = cards.find((entry) => entry.id === item.card_id);
        return <div key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.title}</p>{item.installment_number && <span className="rounded bg-muted px-2 py-0.5 text-[11px]">Parcela {item.installment_number}/{item.installment_count}</span>}{card && <span className="rounded border border-border px-2 py-0.5 text-[11px]">{card.name}</span>}</div><p className="mt-1 text-xs text-muted-foreground">{item.category} · compra {formatDateBR(item.purchase_date)} · vencimento <span className={overdue ? 'font-semibold text-destructive' : ''}>{formatDateBR(item.due_date)}{overdue ? ' · vencida' : ''}</span></p></div>
          <div className="flex items-center justify-between gap-3 sm:justify-end"><p className="font-bold">{formatBRL(Number(item.amount))}</p>{item.status === 'paid' ? <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-600">Paga</span> : <button disabled={!selectedAccountId || payMutation.isPending} onClick={() => void markPaid(item)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Check size={14}/> Marcar paga</button>}</div>
        </div>;
      })}</div>}
    </section>
  </div>;
};

export default ContasAPagarPage;

