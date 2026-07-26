import React, { useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Category, Transaction } from "../types";

interface Props {
  open: boolean;

  category: Category | null;

  categories: Category[];

  transactions: Transaction[];

  onClose: () => void;

  onDelete: (
    categoryId: string,
    moveTo?: string
  ) => Promise<void>;
}

export const DeleteCategoryDialog: React.FC<Props> = ({
  open,
  category,
  categories,
  transactions,
  onClose,
  onDelete,
}) => {
  const [moveTo, setMoveTo] = useState("");

    const usedTransactions = useMemo(() => {

        if (!category) return [];

        return transactions.filter(
            t => t.category === category.name
        );

    }, [transactions, category]);

    const availableCategories = useMemo(() => {

        if (!category) return [];

        return categories.filter(c =>
            c.type === category.type &&
            c.id !== category.id
        );

    }, [categories, category]);

    if (!open || !category)
        return null;

  const handleDelete = async () => {
    if (
      usedTransactions.length > 0 &&
      !moveTo
    ) {
      alert(
        "Selecione uma categoria para mover os lançamentos."
      );
      return;
    }

    await onDelete(
      category.id,
      moveTo || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="w-full max-w-md rounded-xl border bg-background shadow-xl">

        <div className="p-5 border-b border-border flex items-center gap-3">

          <AlertTriangle className="text-destructive" />

          <h2 className="font-bold text-lg">

            Excluir Categoria

          </h2>

        </div>

        <div className="p-5 space-y-5">

          <div>

            <p className="text-sm">

              Deseja realmente excluir

            </p>

            <p className="font-bold mt-1">

              {category.name}

            </p>

          </div>

          {usedTransactions.length > 0 && (
            <>

              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">

                <p className="text-sm text-yellow-700 dark:text-yellow-300">

                  Esta categoria possui

                  <strong>

                    {" "}
                    {usedTransactions.length} lançamento(s)

                  </strong>

                </p>

              </div>

              <div>

                <label className="text-sm font-semibold">

                  Mover lançamentos para

                </label>

                <select
                  className="mt-2 w-full rounded border border-border bg-background px-3 py-2"
                  value={moveTo}
                  onChange={(e) =>
                    setMoveTo(e.target.value)
                  }
                >
                  <option value="">
                    Selecione
                  </option>

                  {availableCategories.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    )
                  )}

                </select>

              </div>

            </>
          )}

          {usedTransactions.length === 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">

              <p className="text-sm text-destructive">

                Esta categoria não possui
                lançamentos.

              </p>

            </div>
          )}

        </div>

        <div className="border-t border-border p-4 flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-border bg-background hover:bg-accent transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleDelete}
            className="px-5 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />

            Excluir

          </button>

        </div>

      </div>

    </div>
  );
};