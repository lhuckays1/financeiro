import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Category } from "../types";
import { formatBRL } from "../lib/format";

interface Props {
  category: Category;
  total: number;
  transactions: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryCard: React.FC<Props> = ({
  category,
  total,
  transactions,
  onEdit,
  onDelete,
}) => {
  const income = category.type === "ganho";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">

      <div className="flex justify-between items-start">

        <div className="flex items-center gap-3">

          <span
            className="w-4 h-4 rounded-full"
            style={{
              backgroundColor: category.color,
            }}
          />

          <div>

            <h3 className="font-semibold text-sm">
              {category.name}
            </h3>

            <p className="text-xs text-muted-foreground">
              {transactions} lançamento(s)
            </p>

          </div>

        </div>

        <div className="flex gap-1">

          <button
            onClick={() => onEdit(category)}
            className="p-2 rounded hover:bg-accent"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => onDelete(category)}
            className="p-2 rounded text-red-500 hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>

        </div>

      </div>

      <div className="mt-4">

        <span
          className={`font-bold ${
            income
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {formatBRL(total)}
        </span>

      </div>

    </div>
  );
};