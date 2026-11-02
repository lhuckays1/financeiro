import React, { useMemo, useState } from 'react';
import { CreditCard as CardIcon, Edit2, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/use-auth';
import { useCategories } from '../hooks/use-finance-data';
import { useCreateCardPurchase, useCreateCreditCard, useCreditCards, useDeleteCreditCard, usePayables, useUpdateCreditCard } from '../hooks/use-payables';
import { CreditCard } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';

const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const nextDueDate = (day: number) => {
  const now = new Date();
  const monthOffset = now.getDate() >= day ? 1 : 0;
  const month = now.getMonth() + monthOffset;
  const year = now.getFullYear() + Math.floor(month / 12);
  const normalizedMonth = month % 12;
  const dueDay = Math.min(day, new Date(year, normalizedMonth + 1, 0).getDate());
  return `${year}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
};

export const CartoesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: cards = [], isLoading: cardsLoading } = useCreditCards(user?.id);
  const { data: payables = [] } = usePayables(user?.id);
  const { data: categories = [] } = useCategories(user?.id);
  const createCard = useCreateCreditCard(user?.id);
  const updateCard = useUpdateCreditCard(user?.id);
  const deleteCard = useDeleteCreditCard(user?.id);
  const createPurchase = useCreateCardPurchase(user?.id);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<CreditCard | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [cardName, setCardName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('5');
  const [dueDay, setDueDay] = useState('12');
  const [cardColor, setCardColor] = useState('#6366F1');
  const [cardId, setCardId] = useState('');
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [category, setCategory] = useState('Outros');
  const [purchaseDate, setPurchaseDate] = useState(localDate());
  const [firstDueDate, setFirstDueDate] = useState('');
  const [installments, setInstallments] = useState('1');
  const selectedCard = cards.find((card) => card.id === cardId);
  const expenseCategories = categories.filter((item) => item.type === 'gasto');

  const cardBalances = useMemo(() => {
    const map = new Map<string, number>();
    for (const card of cards) {
      map.set(card.id, payables.filter((item) => item.card_id === card.id && item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0));
    }
    return map;
  }, [cards, payables]);

  const submitCard = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cardName.trim() || Number(limit) < 0) return toast.error('Informe o nome e um limite válido.');
    const values = { name: cardName.trim(), limit_amount: Number(limit), closing_day: Number(closingDay), due_day: Number(dueDay), color: cardColor };
    if (editingCard) {
      await updateCard.mutateAsync({ ...editingCard, ...values });
    } else {
      await createCard.mutateAsync(values);
    }
    setCardName(''); setLimit(''); setClosingDay('5'); setDueDay('12'); setCardColor('#6366F1'); setEditingCard(null); setShowCardForm(false);
  };

  const startEditingCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setLimit(String(card.limit_amount));
    setClosingDay(String(card.closing_day));
    setDueDay(String(card.due_day));
    setCardColor(card.color);
    setShowCardForm(true);
  };

  const closeCardForm = () => {
    setShowCardForm(false); setEditingCard(null); setCardName(''); setLimit(''); setClosingDay('5'); setDueDay('12'); setCardColor('#6366F1');
  };

  const confirmDeleteCard = async () => {
    if (!deletingCard) return;
    await deleteCard.mutateAsync(deletingCard.id);
    if (cardId === deletingCard.id) { setCardId(''); setShowPurchaseForm(false); }
    setDeletingCard(null);
  };

  const submitPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCard || !title.trim() || Number(total) <= 0 || !firstDueDate) return toast.error('Preencha cartão, compra, valor e primeiro vencimento.');
    const count = Number(installments);
    if (!Number.isInteger(count) || count < 1 || count > 48) return toast.error('Escolha de 1 a 48 parcelas.');
    const available = Number(selectedCard.limit_amount) - (cardBalances.get(selectedCard.id) ?? 0);
    if (Number(total) > available) return toast.error(`Limite disponível: ${formatBRL(Math.max(0, available))}.`);
    await createPurchase.mutateAsync({ card: selectedCard, title, total: Number(total), category: category || 'Outros', purchaseDate, firstDueDate, installments: count });
    setTitle(''); setTotal(''); setInstallments('1'); setShowPurchaseForm(false);
  };

  return <div className="space-y-6">
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Cartões de crédito</h1><p className="text-sm text-muted-foreground">Cadastre cartões e lance compras à vista ou parceladas.</p></div>
      <div className="flex gap-2">
        <button onClick={() => { if (showCardForm) closeCardForm(); else setShowCardForm(true); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm"><Plus size={16} /> Novo cartão</button>
        <button disabled={!cards.length} onClick={() => { setCardId(cards[0]?.id ?? ''); setFirstDueDate(cards[0] ? nextDueDate(cards[0].due_day) : ''); setShowPurchaseForm((value) => !value); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"><ShoppingBag size={16} /> Lançar compra</button>
      </div>
    </header>

    {showCardForm && <form onSubmit={submitCard} className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 p-4 rounded-lg border border-border bg-card">
      <div className="md:col-span-2 xl:col-span-5 flex items-center justify-between"><h2 className="font-semibold">{editingCard ? `Editar ${editingCard.name}` : 'Novo cartão'}</h2><button type="button" onClick={closeCardForm} aria-label="Cancelar edição" className="rounded p-1 text-muted-foreground hover:bg-accent"><X size={18}/></button></div>
      <label className="text-xs space-y-1">Nome do cartão<input required value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ex.: Nubank" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Limite total (R$)<input required type="number" min="0" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Dia de fechamento<input required type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Dia de vencimento<input required type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <div className="flex items-end gap-2"><input aria-label="Cor do cartão" type="color" value={cardColor} onChange={(e) => setCardColor(e.target.value)} className="h-10 w-12" /><button disabled={createCard.isPending || updateCard.isPending} className="flex-1 rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{editingCard ? 'Salvar alterações' : 'Salvar cartão'}</button>{editingCard && <button type="button" onClick={closeCardForm} className="rounded border border-border px-3 py-2 text-sm">Cancelar</button>}</div>
    </form>}

    {showPurchaseForm && <form onSubmit={submitPurchase} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 p-4 rounded-lg border border-border bg-card">
      <label className="text-xs space-y-1">Cartão<select required value={cardId} onChange={(e) => { setCardId(e.target.value); const selected = cards.find((item) => item.id === e.target.value); if (selected) setFirstDueDate(nextDueDate(selected.due_day)); }} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
      <label className="text-xs space-y-1">Descrição da compra<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Notebook" className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Valor total (R$)<input required type="number" min="0.01" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Categoria<select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm">{expenseCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}{!expenseCategories.some((item) => item.name === 'Outros') && <option value="Outros">Outros</option>}</select></label>
      <label className="text-xs space-y-1">Data da compra<input required type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Primeiro vencimento<input required type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <label className="text-xs space-y-1">Parcelas<input required type="number" min="1" max="48" value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-full rounded border border-border bg-background px-3 py-2 text-sm" /></label>
      <div className="flex items-end"><button disabled={createPurchase.isPending} className="w-full rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Adicionar à fatura</button></div>
      <p className="md:col-span-2 xl:col-span-4 text-xs text-muted-foreground">O valor será dividido nas parcelas e cada uma aparecerá em Contas a pagar. O saldo da conta bancária só é atualizado quando a fatura/parcela for paga.</p>
    </form>}

    {cardsLoading ? <p className="py-10 text-center text-muted-foreground">Carregando cartões…</p> : cards.length === 0 ? <div className="rounded-lg border border-dashed border-border p-12 text-center"><CardIcon className="mx-auto mb-3 text-muted-foreground"/><p className="font-semibold">Nenhum cartão cadastrado</p><p className="mt-1 text-sm text-muted-foreground">Cadastre seu cartão para começar a lançar compras.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card: CreditCard) => {
      const used = cardBalances.get(card.id) ?? 0;
      const pending = payables.filter((item) => item.card_id === card.id && item.status === 'pending').length;
      return <article key={card.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">Cartão</p><h2 className="text-lg font-bold">{card.name}</h2></div><div className="flex items-center gap-1"><button type="button" onClick={() => startEditingCard(card)} aria-label={`Editar ${card.name}`} title="Editar cartão" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 size={16}/></button><button type="button" onClick={() => setDeletingCard(card)} aria-label={`Excluir ${card.name}`} title="Excluir cartão" className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16}/></button><span className="rounded-lg p-2" style={{ color: card.color, backgroundColor: `${card.color}20` }}><CardIcon size={20}/></span></div></div>
        <div><div className="flex justify-between text-sm"><span>Limite usado</span><b>{formatBRL(used)}</b></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.min(100, card.limit_amount ? used / Number(card.limit_amount) * 100 : 0)}%`, backgroundColor: card.color }}/></div><p className="mt-1 text-xs text-muted-foreground">Disponível: {formatBRL(Math.max(0, Number(card.limit_amount) - used))} de {formatBRL(Number(card.limit_amount))}</p></div>
        <div className="flex justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>Fecha dia {card.closing_day}</span><span>Vence dia {card.due_day}</span></div><p className="text-xs text-muted-foreground">{pending} parcela(s) em aberto</p>
      </article>;
    })}</div>}
    {deletingCard && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><div role="alertdialog" aria-modal="true" className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-center gap-3 text-destructive"><Trash2 size={22}/><h2 className="text-lg font-bold text-foreground">Excluir cartão</h2></div><p className="text-sm text-muted-foreground">Deseja excluir <strong className="text-foreground">{deletingCard.name}</strong>?{(payables.filter((item) => item.card_id === deletingCard.id).length > 0) && <> As compras e parcelas já lançadas serão mantidas em Contas a pagar, mas ficarão sem vínculo com este cartão.</>}</p><div className="flex justify-end gap-2"><button type="button" onClick={() => setDeletingCard(null)} className="rounded-md border border-border px-4 py-2 text-sm">Cancelar</button><button type="button" onClick={() => void confirmDeleteCard()} disabled={deleteCard.isPending} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">{deleteCard.isPending ? 'Excluindo…' : 'Excluir cartão'}</button></div></div></div>}
    <section className="rounded-lg border border-border bg-card p-4"><h2 className="mb-3 font-semibold">Compras recentes no cartão</h2>{payables.filter((item) => item.card_id).slice(0, 8).length ? <div className="divide-y divide-border">{payables.filter((item) => item.card_id).slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{cards.find((card) => card.id === item.card_id)?.name ?? 'Cartão'} · vence {formatDateBR(item.due_date)}</p></div><div className="text-right"><p className="font-semibold">{formatBRL(Number(item.amount))}</p><p className="text-xs text-muted-foreground">{item.status === 'paid' ? 'Paga' : 'Em aberto'}</p></div></div>)}</div> : <p className="text-sm text-muted-foreground">As compras lançadas aparecerão aqui.</p>}</section>
  </div>;
};

export default CartoesPage;

