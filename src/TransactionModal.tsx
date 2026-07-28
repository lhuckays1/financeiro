import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { useTransactionModalStore } from '../store/transaction-modal-store';
import { useAuth } from '../hooks/use-auth';
import { useCategories, useAddTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/use-finance-data';
import { useAccounts } from "../hooks/useAccounts";
import { maskCurrencyInput, parseCurrencyToNumber, formatBRL, formatInputDate } from '../lib/format';
import { TransactionType } from '../types';

export const TransactionModal: React.FC = () => {
  const { isOpen, editingTransaction, defaultType, closeModal } = useTransactionModalStore();
  const { user } = useAuth();
  const { data: categories = [] } = useCategories(user?.id);
  const { data: accounts = [] } = useAccounts(user?.id);

  const addTxMutation = useAddTransaction(user?.id);
  const updateTxMutation = useUpdateTransaction(user?.id);
  const deleteTxMutation = useDeleteTransaction(user?.id);

  const [type, setType] = useState<TransactionType>(defaultType || 'gasto');
  const [description, setDescription] = useState('');
  const [rawAmount, setRawAmount] = useState('R$ 0,00');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(formatInputDate(new Date()));
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setRawAmount(formatBRL(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setAccountId(editingTransaction.account_id || "");
      setDate(editingTransaction.date);
    } else {
      setType(defaultType || 'gasto');
      setDescription('');
      setRawAmount('R$ 0,00');
        if (accounts.length > 0) {
          setAccountId(accounts[0].id);
        } else {
          setAccountId("");
        }
      setDate(formatInputDate(new Date()));
      // Auto select first category for selected type
      const filtered = categories.filter(
        (c) => c.type === (defaultType || "gasto")
      );

      if (filtered.length > 0) {
          setCategory(filtered[0].name);
      } else {
          setCategory("");
      }
    }
  }, [editingTransaction, isOpen, defaultType, categories, accounts,]);

  const handleDelete = async () => {
    if (!editingTransaction) return;
    await deleteTxMutation.mutateAsync(editingTransaction.id);
    setConfirmDelete(false);
    closeModal();
  };

  // When type changes, adjust category selection if current category doesn't match new type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const filtered = categories.filter((c) => c.type === newType);
    if (!filtered.some((c) => c.name === category)) {
      setCategory(filtered.length > 0 ? filtered[0].name : '');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRawAmount(maskCurrencyInput(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrencyToNumber(rawAmount);

    if (numericAmount <= 0) {
      alert('Informe um valor maior que zero.');
      return;
    }

    if (!description.trim()) {
      alert('Informe uma descrição.');
      return;
    }

    const selectedCategoryName = category || (type === 'ganho' ? 'Outros' : 'Outros');

    if (accounts.length === 0) {
      alert("Cadastre uma conta antes de criar um lançamento.");
      return;
    }

    if (!accountId) {
      alert("Selecione uma conta.");
      return;
    }

    if (editingTransaction) {
      await updateTxMutation.mutateAsync({
        ...editingTransaction,
        type,
        description: description.trim(),
        amount: numericAmount,
        category: selectedCategoryName,
        account_id: accountId,
        date,
      });
    } else {
      await addTxMutation.mutateAsync({
      type,
      description: description.trim(),
      amount: numericAmount,
      category: selectedCategoryName,
      account_id: accountId,
      date,
    });
    }

    closeModal();
  };

  if (!isOpen) return null;

  const availableCategories = categories.filter((c) => c.type === type);

  const isSubmitting = addTxMutation.isPending || updateTxMutation.isPending;

  return (
    <div
      id="transaction-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 transition-opacity"
    >
      <div
        id="transaction-modal-content"
        className="w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-md p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground">
            {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            id="close-transaction-modal-btn"
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Switcher Pill */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-md">
          <button
            id="modal-type-ganho-btn"
            type="button"
            onClick={() => handleTypeChange('ganho')}
            className={`py-2 px-3 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              type === 'ganho'
                ? 'bg-success/20 text-success border border-success/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ganho</span>
          </button>
          <button
            id="modal-type-gasto-btn"
            type="button"
            onClick={() => handleTypeChange('gasto')}
            className={`py-2 px-3 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
              type === 'gasto'
                ? 'bg-destructive/20 text-destructive border border-destructive/30 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Gasto</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor Input with realtime mask */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Valor
            </label>
            <input
              id="transaction-amount-input"
              type="text"
              value={rawAmount}
              onChange={handleAmountChange}
              placeholder="R$ 0,00"
              required
              className={`w-full px-4 py-3 rounded-md bg-background border border-border text-2xl font-bold tracking-tight focus:outline-none focus:ring-2 ${
                type === 'ganho'
                  ? 'text-success focus:ring-success/50'
                  : 'text-destructive focus:ring-destructive/50'
              }`}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Descrição
            </label>
            <input
              id="transaction-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Salário, Freelance..."
              required
              className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Conta
            </label>

            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
              disabled={accounts.length === 0}
              className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {accounts.length === 0 ? (
                <option value="">
                  Nenhuma conta cadastrada
                </option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Categoria & Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                id="transaction-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableCategories.length === 0 && (
                  <option value="Outros">Outros</option>
                )}
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Data
              </label>
              <input
                id="transaction-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              {editingTransaction && !confirmDelete && (
                <button
                  id="delete-transaction-modal-btn"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-md border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )}
              {editingTransaction && confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-destructive font-semibold">Excluir este lançamento?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteTxMutation.isPending}
                    className="px-2.5 py-1 rounded bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90"
                  >
                    {deleteTxMutation.isPending ? 'Excluindo...' : 'Sim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1 rounded border border-border text-muted-foreground text-xs font-medium hover:bg-accent"
                  >
                    Não
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                id="cancel-transaction-modal-btn"
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                id="save-transaction-modal-btn"
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-md ${
                  type === 'ganho'
                    ? 'bg-success text-success-foreground hover:opacity-90'
                    : 'bg-destructive text-destructive-foreground hover:opacity-90'
                }`}
              >
                {isSubmitting ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
