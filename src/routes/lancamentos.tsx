import React, { useState, useMemo } from 'react';
import { Search, Filter, Edit2, Trash2, Plus } from 'lucide-react';
import { PeriodSelector } from '../components/PeriodSelector';
import { usePeriodStore } from '../store/period-store';
import { useAuth } from '../hooks/use-auth';
import { useTransactions, useDeleteTransaction } from '../hooks/use-finance-data';
import { formatBRL, formatDateBR } from '../lib/format';
import { useTransactionModalStore } from '../store/transaction-modal-store';
import { Transaction, TransactionType } from '../types';

export const LancamentosPage: React.FC = () => {
  const { user } = useAuth();
  const { getRange } = usePeriodStore();
  const { openModal } = useTransactionModalStore();

  const { data: transactions = [] } = useTransactions(user?.id);
  const deleteTxMutation = useDeleteTransaction(user?.id);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const range = getRange();

  // Filter transactions by period, search query and type filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Period check
      const d = new Date(`${t.date}T00:00:00`);
      if (d < range.from || d > range.to) return false;

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Search query (matches description or category)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [transactions, range, typeFilter, search]);

  const handleDeleteClick = (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    setDeletingTx(tx);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    await deleteTxMutation.mutateAsync(deletingTx.id);
    setDeletingTx(null);
  };

  return (
    <div className="space-y-6" id="lancamentos-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as suas entradas e saídas registradas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector />
          <button
            type="button"
            onClick={() => openModal(null, 'gasto')}
            className="px-3.5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-md bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            id="lancamentos-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full pl-9 pr-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Tipo:
          </span>
          <button
            id="filter-type-all"
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            id="filter-type-ganho"
            type="button"
            onClick={() => setTypeFilter('ganho')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'ganho'
                ? 'bg-success text-success-foreground'
                : 'bg-background border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Ganhos
          </button>
          <button
            id="filter-type-gasto"
            type="button"
            onClick={() => setTypeFilter('gasto')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'gasto'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-background border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Gastos
          </button>
        </div>
      </div>

      {/* Transactions Table (Desktop) / Compact Cards (Mobile) */}
      <div className="rounded-md bg-card border border-border shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground space-y-3">
            <p>Nenhum lançamento encontrado para os filtros aplicados.</p>
            <button
              type="button"
              onClick={() => openModal(null, 'gasto')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar lançamento</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => openModal(tx)}
                      className="hover:bg-accent/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 text-muted-foreground text-xs font-medium whitespace-nowrap">
                        {formatDateBR(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              tx.type === 'ganho' ? 'bg-success' : 'bg-destructive'
                            }`}
                          ></span>
                          <span>{tx.description}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="inline-block px-2 py-0.5 rounded-xs bg-background border border-border text-xs">
                          {tx.category}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                          tx.type === 'ganho' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {tx.type === 'ganho' ? '+' : '-'} {formatBRL(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(tx);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(e, tx)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/15"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact List */}
            <div className="md:hidden divide-y divide-border">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => openModal(tx)}
                  className="p-4 flex items-center justify-between hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        tx.type === 'ganho' ? 'bg-success' : 'bg-destructive'
                      }`}
                    ></div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span className="px-1.5 py-0.5 rounded-xs bg-background border border-border">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span>{formatDateBR(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        tx.type === 'ganho' ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {tx.type === 'ganho' ? '+' : '-'} {formatBRL(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, tx)}
                      className="p-1 rounded-md text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-md p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2.5 rounded-full bg-destructive/15">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Excluir Lançamento</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lançamento{' '}
              <strong className="text-foreground">"{deletingTx.description}"</strong> no valor de{' '}
              <strong className="text-foreground">{formatBRL(deletingTx.amount)}</strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="px-4 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteTxMutation.isPending}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {deleteTxMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
