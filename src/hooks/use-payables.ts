import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, Payable } from '../types';
import { isNeonConfigured, neon } from '../lib/neon';

export function useCreditCards(userId?: string) {
  return useQuery({
    queryKey: ['credit-cards', userId],
    enabled: Boolean(userId && isNeonConfigured),
    queryFn: async (): Promise<CreditCard[]> => {
      const { data, error } = await neon!.from('credit_cards').select('*').eq('user_id', userId!).order('created_at');
      if (error) throw error;
      return (data ?? []) as CreditCard[];
    },
  });
}

export function usePayables(userId?: string) {
  return useQuery({
    queryKey: ['payables', userId],
    enabled: Boolean(userId && isNeonConfigured),
    queryFn: async (): Promise<Payable[]> => {
      const { data, error } = await neon!.from('payables').select('*').eq('user_id', userId!).order('due_date');
      if (error) throw error;
      return (data ?? []) as Payable[];
    },
  });
}

export function useCreateCreditCard(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId || !neon) throw new Error('Conecte-se para cadastrar um cartão.');
      const { data, error } = await neon.from('credit_cards').insert({ ...input, user_id: userId }).select().single();
      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards', userId] });
      toast.success('Cartão cadastrado.');
    },
    onError: (error: Error) => toast.error(`Não foi possível cadastrar o cartão: ${error.message}`),
  });
}

export function useUpdateCreditCard(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (card: CreditCard) => {
      if (!userId || !neon) throw new Error('Conecte-se para editar cartões.');
      const { data, error } = await neon.from('credit_cards').update({
        name: card.name,
        limit_amount: card.limit_amount,
        closing_day: card.closing_day,
        due_day: card.due_day,
        color: card.color,
      }).eq('id', card.id).eq('user_id', userId).select().single();
      if (error) throw error;
      return data as CreditCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards', userId] });
      toast.success('Cartão atualizado.');
    },
    onError: (error: Error) => toast.error(`Não foi possível editar o cartão: ${error.message}`),
  });
}

export function useDeleteCreditCard(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      if (!userId || !neon) throw new Error('Conecte-se para excluir cartões.');
      const { error } = await neon.from('credit_cards').delete().eq('id', cardId).eq('user_id', userId);
      if (error) throw error;
      return cardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards', userId] });
      queryClient.invalidateQueries({ queryKey: ['payables', userId] });
      toast.success('Cartão excluído. As obrigações já lançadas foram preservadas.');
    },
    onError: (error: Error) => toast.error(`Não foi possível excluir o cartão: ${error.message}`),
  });
}

export function useCreatePayable(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Pick<Payable, 'title' | 'amount' | 'category' | 'due_date' | 'purchase_date'>) => {
      if (!userId || !neon) throw new Error('Conecte-se para cadastrar uma conta a pagar.');
      const { data, error } = await neon.from('payables').insert({ ...input, user_id: userId }).select().single();
      if (error) throw error;
      return data as Payable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables', userId] });
      toast.success('Conta a pagar cadastrada.');
    },
    onError: (error: Error) => toast.error(`Não foi possível cadastrar: ${error.message}`),
  });
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const targetDay = Math.min(day, new Date(targetYear, normalizedMonth + 1, 0).getDate());
  return `${targetYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
}

export function useCreateCardPurchase(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      card: CreditCard;
      title: string;
      total: number;
      category: string;
      purchaseDate: string;
      firstDueDate: string;
      installments: number;
    }) => {
      if (!userId || !neon) throw new Error('Conecte-se para lançar compras no cartão.');
      const cents = Math.round(input.total * 100);
      const baseCents = Math.floor(cents / input.installments);
      const remainder = cents - baseCents * input.installments;
      const group = crypto.randomUUID();
      const rows = Array.from({ length: input.installments }, (_, index) => ({
        user_id: userId,
        title: `${input.title.trim()} (${index + 1}/${input.installments})`,
        amount: (baseCents + (index === input.installments - 1 ? remainder : 0)) / 100,
        category: input.category,
        due_date: addMonths(input.firstDueDate, index),
        purchase_date: input.purchaseDate,
        card_id: input.card.id,
        purchase_group: group,
        installment_number: index + 1,
        installment_count: input.installments,
      }));
      const { data, error } = await neon.from('payables').insert(rows).select();
      if (error) throw error;
      return data as Payable[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables', userId] });
      queryClient.invalidateQueries({ queryKey: ['credit-cards', userId] });
      toast.success('Compra e parcelas lançadas na fatura.');
    },
    onError: (error: Error) => toast.error(`Não foi possível lançar a compra: ${error.message}`),
  });
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function usePayPayable(userId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payable, accountId }: { payable: Payable; accountId: string }) => {
      if (!userId || !neon) throw new Error('Conecte-se para registrar pagamentos.');
      if (payable.status === 'paid') return payable;

      const { data: existing, error: lookupError } = await neon
        .from('transactions').select('id').eq('source_payable_id', payable.id).maybeSingle();
      if (lookupError) throw lookupError;

      if (!existing) {
        const { error: transactionError } = await neon.from('transactions').insert({
          user_id: userId,
          type: 'gasto',
          description: payable.title,
          amount: payable.amount,
          category: payable.category,
          account_id: accountId,
          date: localToday(),
          source_payable_id: payable.id,
        });
        if (transactionError) throw transactionError;
      }

      const { data, error } = await neon.from('payables').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_account_id: accountId,
      }).eq('id', payable.id).eq('user_id', userId).eq('status', 'pending').select().single();
      if (error) throw error;
      return data as Payable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables', userId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
      toast.success('Pagamento registrado como despesa na conta.');
    },
    onError: (error: Error) => toast.error(`Não foi possível registrar o pagamento: ${error.message}`),
  });
}

