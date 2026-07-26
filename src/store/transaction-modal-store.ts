import { create } from 'zustand';
import { Transaction } from '../types';

interface TransactionModalState {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  defaultType?: 'ganho' | 'gasto';
  openModal: (transaction?: Transaction | null, defaultType?: 'ganho' | 'gasto') => void;
  closeModal: () => void;
}

export const useTransactionModalStore = create<TransactionModalState>((set) => ({
  isOpen: false,
  editingTransaction: null,
  defaultType: 'gasto',

  openModal: (transaction = null, defaultType = 'gasto') => {
    set({
      isOpen: true,
      editingTransaction: transaction,
      defaultType: transaction ? transaction.type : defaultType,
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      editingTransaction: null,
    });
  },
}));
