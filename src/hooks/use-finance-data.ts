import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Category, Transaction } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  DEFAULT_CATEGORIES,
  getStoredCategories,
  saveStoredCategories,
  getStoredTransactions,
  saveStoredTransactions,
} from '../lib/supabase';
import { toast } from 'sonner';

// Categories hooks
export function useCategories(userId?: string) {
  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async (): Promise<Category[]> => {
      if (!userId) return [];

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) {
          console.error('Error loading categories from Supabase:', error);
          return getStoredCategories(userId);
        }
        if (data && data.length === 0) {
          // Seed default categories into Supabase for this user
          const defaultCatsToInsert = DEFAULT_CATEGORIES.map((c) => ({
            user_id: userId,
            name: c.name,
            type: c.type,
            color: c.color,
          }));
          const { data: seeded, error: seedErr } = await supabase
            .from('categories')
            .insert(defaultCatsToInsert)
            .select();
          if (!seedErr && seeded && seeded.length > 0) {
            return seeded as Category[];
          }
        }
        return data as Category[];
      } else {
        return getStoredCategories(userId);
      }
    },
    enabled: Boolean(userId),
  });
}

export function useAddCategory(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCat: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: newCat.name,
            type: newCat.type,
            color: newCat.color,
          })
          .select()
          .single();

        if (error) throw error;
        return data as Category;
      } else {
        const categories = getStoredCategories(userId);
        const created: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          user_id: userId,
          name: newCat.name,
          type: newCat.type,
          color: newCat.color,
          created_at: new Date().toISOString(),
        };
        const updated = [...categories, created];
        saveStoredCategories(userId, updated);
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      toast.success('Categoria adicionada!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao adicionar categoria: ${err.message}`);
    },
  });
}

// Transactions hooks
export function useTransactions(userId?: string) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: async (): Promise<Transaction[]> => {
      if (!userId) return [];

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        if (error) {
          console.error('Error loading transactions from Supabase:', error);
          return getStoredTransactions(userId);
        }
        return data as Transaction[];
      } else {
        return getStoredTransactions(userId);
      }
    },
    enabled: Boolean(userId),
  });
}

export function useAddTransaction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
              user_id: userId,
              type: newTx.type,
              description: newTx.description,
              amount: newTx.amount,
              category: newTx.category,
              account_id: newTx.account_id,
              date: newTx.date,
          })
          .select()
          .single();

        if (error) throw error;
        return data as Transaction;
      } else {
        const current = getStoredTransactions(userId);
        const created: Transaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          user_id: userId,
          type: newTx.type,
          description: newTx.description,
          amount: newTx.amount,
          category: newTx.category,
          account_id: newTx.account_id,
          date: newTx.date,
          created_at: new Date().toISOString(),
        };
        const updated = [created, ...current];
        saveStoredTransactions(userId, updated);
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      toast.success('Lançamento registrado com sucesso!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar lançamento: ${err.message}`);
    },
  });
}

export function useUpdateTransaction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tx: Transaction) => {
      if (!userId) throw new Error('Usuário não autenticado');

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('transactions')
          .update({
            type: tx.type,
            description: tx.description,
            amount: tx.amount,
            category: tx.category,
            account_id: tx.account_id,
            date: tx.date,
          })
          .eq('id', tx.id)
          .select()
          .single();

        if (error) throw error;
        return data as Transaction;
      } else {
        const current = getStoredTransactions(userId);
        const updated = current.map((t) => (t.id === tx.id ? tx : t));
        saveStoredTransactions(userId, updated);
        return tx;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      toast.success('Lançamento atualizado!');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao atualizar lançamento: ${err.message}`);
    },
  });
}

export function useDeleteTransaction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        return id;
      } else {
        const current = getStoredTransactions(userId);
        const updated = current.filter((t) => t.id !== id);
        saveStoredTransactions(userId, updated);
        return id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
      toast.success('Lançamento excluído.');
    },
    onError: (err: Error) => {
      toast.error(`Erro ao excluir lançamento: ${err.message}`);
    },
  });
}

export function useUpdateCategory(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      category: Category & { oldName: string }
    ) => {
      if (!userId) {
        throw new Error("Usuário não autenticado");
      }

      if (isSupabaseConfigured && supabase) {

        const { data, error } = await supabase
          .from("categories")
          .update({
            name: category.name,
            type: category.type,
            color: category.color,
          })
          .eq("id", category.id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) throw error;

        // Atualiza todas as transações que usam a categoria antiga
        const { error: txError } = await supabase
          .from("transactions")
          .update({
            category: category.name,
          })
          .eq("user_id", userId)
          .eq("category", category.oldName);

        if (txError) throw txError;

        return data;
      }

      // LocalStorage (modo demo)
      const categories = getStoredCategories(userId);

      const updated = categories.map((c) =>
        c.id === category.id
          ? {
              ...c,
              name: category.name,
              type: category.type,
              color: category.color,
            }
          : c
      );

      saveStoredCategories(userId, updated);

      const transactions = getStoredTransactions(userId);

      const txUpdated = transactions.map((t) =>
        t.category === category.oldName
          ? {
              ...t,
              category: category.name,
            }
          : t
      );

      saveStoredTransactions(userId, txUpdated);

      return category;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });

      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });

      toast.success("Categoria atualizada.");
    },

    onError(error: any) {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory(userId?: string) {

  const queryClient = useQueryClient();

  return useMutation({

    mutationFn: async (params: {

      categoryId: string;

      categoryName: string;

      moveTo?: string;

    }) => {

      if (!userId)
        throw new Error("Usuário não autenticado");

      const {

        categoryId,

        categoryName,

        moveTo,

      } = params;

      // Verifica se existem lançamentos utilizando esta categoria
      const transactions = isSupabaseConfigured && supabase
        ? (
            await supabase
              .from("transactions")
              .select("id")
              .eq("user_id", userId)
              .eq("category", categoryName)
          ).data ?? []
        : getStoredTransactions(userId).filter(
            t => t.category === categoryName
          );

      if (transactions.length > 0 && !moveTo) {
        throw new Error(
          "Esta categoria possui lançamentos. Selecione outra categoria para mover os registros."
        );
      }

      if (isSupabaseConfigured && supabase) {

        if (moveTo) {

          const { error: txError } = await supabase
            .from("transactions")
            .update({
              category: moveTo,
            })
            .eq("user_id", userId)
            .eq("category", categoryName);

          if (txError)
            throw txError;
        }

        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId)
          .eq("user_id", userId);

        if (error)
          throw error;

        return;
      }

      // LocalStorage

      const categories =
        getStoredCategories(userId);

      saveStoredCategories(

        userId,

        categories.filter(
          (c) => c.id !== categoryId
        )

      );

      if (moveTo) {

        const tx =
          getStoredTransactions(userId);

        saveStoredTransactions(

          userId,

          tx.map((t) =>
            t.category === categoryName
              ? {
                  ...t,
                  category: moveTo,
                }
              : t
          )

        );

      }

    },

    onSuccess() {

      queryClient.invalidateQueries({

        queryKey: ["categories"],

      });

      queryClient.invalidateQueries({

        queryKey: ["transactions"],

      });

      toast.success(
        "Categoria excluída."
      );

    },

    onError(error: any) {

      toast.error(error.message);

    },

  });

}
