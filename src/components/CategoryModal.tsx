import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { Category, TransactionType } from "../types";

const COLOR_PRESETS = [
  "#10B981",
  "#22C55E",
  "#14B8A6",
  "#0EA5E9",
  "#6366F1",
  "#EF4444",
  "#F59E0B",
  "#F97316",
  "#EC4899",
  "#8B5CF6",
  "#A855F7",
  "#64748B",
];

interface CategoryModalProps {
  open: boolean;
  category?: Category | null;
  categories: Category[];

  onClose: () => void;

  onSave: (
    category: Omit<Category, "id" | "user_id" | "created_at">
  ) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  category,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("gasto");
  const [color, setColor] = useState("#6366F1");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
    } else {
      setName("");
      setType("gasto");
      setColor("#6366F1");
    }
  }, [category, open]);

  if (!open) return null;

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const normalized = name.trim();

    if (!normalized) {
      alert("Informe o nome da categoria.");
      return;
    }

    const duplicated = categories.some((c) => {
      if (category && c.id === category.id) return false;

      return (
        c.type === type &&
        c.name.trim().toLowerCase() ===
          normalized.toLowerCase()
      );
    });

    if (duplicated) {
      alert("Já existe uma categoria com esse nome.");
      return;
    }

    await onSave({
      name: normalized,
      type,
      color,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-md">

        <div className="flex justify-between items-center p-5 border-b border-border">

          <h2 className="font-bold text-lg">

            {category
              ? "Editar Categoria"
              : "Nova Categoria"}

          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-accent"
          >
            <X size={18} />
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-5"
        >
          <div>

            <label className="text-sm font-semibold">

              Nome

            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />

          </div>

          <div>

            <label className="text-sm font-semibold">

              Tipo

            </label>

            <div className="grid grid-cols-2 gap-2 mt-2">

              <button
                type="button"
                onClick={() => setType("ganho")}
                className={`rounded p-2 border ${
                  type === "ganho"
                    ? "bg-green-600 text-white"
                    : ""
                }`}
              >
                Ganho
              </button>

              <button
                type="button"
                onClick={() => setType("gasto")}
                className={`rounded p-2 border ${
                  type === "gasto"
                    ? "bg-red-600 text-white"
                    : ""
                }`}
              >
                Gasto
              </button>

            </div>

          </div>

          <div>

            <label className="text-sm font-semibold">

              Cor

            </label>

            <div className="flex flex-wrap gap-2 mt-2">

              {COLOR_PRESETS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setColor(item)}
                  className={`w-8 h-8 rounded-full ${
                    color === item
                      ? "ring-4 ring-primary"
                      : ""
                  }`}
                  style={{
                    backgroundColor: item,
                  }}
                />
              ))}

            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-border"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded bg-primary text-primary-foreground flex items-center gap-2"
            >
              <Save size={16} />

              {category
                ? "Salvar Alterações"
                : "Criar Categoria"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};