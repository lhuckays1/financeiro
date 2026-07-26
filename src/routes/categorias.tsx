import React, { useState, useMemo } from 'react';
import { Plus, Tag, TrendingUp, TrendingDown, Pencil, Trash2, } from 'lucide-react';
import { PeriodSelector } from '../components/PeriodSelector';
import { usePeriodStore } from '../store/period-store';
import { useAuth } from '../hooks/use-auth';
import { useCategories, useAddCategory, useTransactions, useUpdateCategory, useDeleteCategory } from '../hooks/use-finance-data';
import { formatBRL } from '../lib/format';
import { TransactionType } from '../types';
import { CategoryCard } from "../components/CategoryCard";
import { CategoryModal } from "../components/CategoryModal";
import { DeleteCategoryDialog } from "../components/DeleteCategoryDialog";

const COLOR_PRESETS = [
  '#10B981', '#22C55E', '#14B8A6', '#0EA5E9', '#6366F1',
  '#EF4444', '#F59E0B', '#F97316', '#EC4899', '#8B5CF6', '#A855F7', '#64748B'
];

export const CategoriasPage: React.FC = () => {
  const { user } = useAuth();
  const { getRange } = usePeriodStore();

  const { data: categories = [] } = useCategories(user?.id);
  const { data: transactions = [] } = useTransactions(user?.id);
  const addCategoryMutation = useAddCategory(user?.id);

  const updateCategoryMutation =
    useUpdateCategory(user?.id);

  const deleteCategoryMutation =
      useDeleteCategory(user?.id);

  const [editingCategory, setEditingCategory] =
      useState<Category | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] =
      useState(false);

  const [deleteCategory, setDeleteCategory] =
      useState<Category | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] =
      useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('gasto');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const range = getRange();

  // Calculate total transacted for each category in current period
  const categoryTotals = useMemo(() => {
    const currentTx = transactions.filter((t) => {
      const d = new Date(`${t.date}T00:00:00`);
      return d >= range.from && d <= range.to;
    });

    const totals = new Map<string, number>();
    currentTx.forEach((t) => {
      const cur = totals.get(t.category) || 0;
      totals.set(t.category, cur + Number(t.amount));
    });

    return totals;
  }, [transactions, range]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addCategoryMutation.mutateAsync({
      name: name.trim(),
      type,
      color: selectedColor,
    });

    setName('');
  };

  const handleEdit = (category: Category) => {
  setEditingCategory(category);
  setCategoryModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleSaveCategory = async (
    categoryData: Omit<Category, "id" | "user_id" | "created_at">
  ) => {
    if (!editingCategory) return;

    await updateCategoryMutation.mutateAsync({
      ...editingCategory,
      ...categoryData,
      oldName: editingCategory.name,
    });

    setEditingCategory(null);
    setCategoryModalOpen(false);
  };

  const handleDeleteCategory = async (
    categoryId: string,
    moveTo?: string
  ) => {
    if (!deleteCategory) return;

    await deleteCategoryMutation.mutateAsync({
      categoryId,
      categoryName: deleteCategory.name,
      moveTo,
    });

    setDeleteCategory(null);
    setDeleteDialogOpen(false);
  };

  const ganhosCategories = categories.filter((c) => c.type === 'ganho');
  const gastosCategories = categories.filter((c) => c.type === 'gasto');

  return (
    <div className="space-y-6" id="categorias-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize seus lançamentos por categorias de ganhos e gastos.
          </p>
        </div>
        <PeriodSelector />
      </div>

      {/* Top Form: Add New Category */}
      <div className="p-5 rounded-md bg-card border border-border shadow-xs space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Tag className="w-4 h-4 text-primary" />
          <span>Nova Categoria</span>
        </h2>

        <form onSubmit={handleAddCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Nome da Categoria
              </label>
              <input
                id="category-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Educação, Pet Shop, Investimentos..."
                required
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-md">
                <button
                  type="button"
                  onClick={() => setType('ganho')}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    type === 'ganho'
                      ? 'bg-success/20 text-success border border-success/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ganho</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('gasto')}
                  className={`py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    type === 'gasto'
                      ? 'bg-destructive/20 text-destructive border border-destructive/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Gasto</span>
                </button>
              </div>
            </div>

            {/* Color Palette Selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Cor de Identificação
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              id="add-category-btn"
              type="submit"
              disabled={addCategoryMutation.isPending}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{addCategoryMutation.isPending ? 'Salvando...' : 'Adicionar Categoria'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Two Columns Grid: Ganhos / Gastos Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Ganhos Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-base font-bold text-success flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Categorias de Ganhos ({ganhosCategories.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ganhosCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                total={categoryTotals.get(cat.name) || 0}
                transactions={
                  transactions.filter(
                    (t) => t.category === cat.name
                  ).length
                }
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>

        {/* Column 2: Gastos Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-base font-bold text-destructive flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              <span>Categorias de Gastos ({gastosCategories.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gastosCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                total={categoryTotals.get(cat.name) || 0}
                transactions={
                  transactions.filter(
                    (t) => t.category === cat.name
                  ).length
                }
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      </div>
      <CategoryModal
        open={categoryModalOpen}
        category={editingCategory}
        categories={categories}
        onClose={() => {
          setEditingCategory(null);
          setCategoryModalOpen(false);
        }}
        onSave={handleSaveCategory}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        category={deleteCategory}
        categories={categories}
        transactions={transactions}
        onClose={() => {
          setDeleteCategory(null);
          setDeleteDialogOpen(false);
        }}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
};
