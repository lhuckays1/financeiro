import React, { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

import { Account, AccountType } from "../types";

const ACCOUNT_TYPES: AccountType[] = [
  "Conta Corrente",
  "Conta Poupança",
  "Conta Digital",
  "Carteira",
  "Dinheiro",
  "Investimento",
];

const COLORS = [
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#64748B",
];

interface Props {
  open: boolean;

  account?: Account | null;

  accounts: Account[];

  onClose: () => void;

  onSave: (
    account: Omit<
      Account,
      "id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
}

export const AccountModal: React.FC<Props> = ({
  open,
  account,
  accounts,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");

  const [type, setType] =
    useState<AccountType>("Conta Corrente");

  const [color, setColor] =
    useState("#6366F1");

  const [initialBalance, setInitialBalance] =
    useState(0);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setColor(account.color);
      setInitialBalance(account.initial_balance);
    } else {
      setName("");
      setType("Conta Corrente");
      setColor("#6366F1");
      setInitialBalance(0);
    }
  }, [account, open]);

  if (!open) return null;

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const normalized = name.trim();

    if (!normalized) {
      alert("Informe o nome da conta.");
      return;
    }

    const exists = accounts.some((a) => {
      if (account && a.id === account.id)
        return false;

      return (
        a.name.toLowerCase() ===
        normalized.toLowerCase()
      );
    });

    if (exists) {
      alert("Já existe uma conta com esse nome.");
      return;
    }

    await onSave({
      user_id: account?.user_id || "",
      name: normalized,
      type,
      color,
      initial_balance: Number(initialBalance),
      is_active: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">

      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">

        <div className="flex items-center justify-between p-5 border-b border-border">

          <h2 className="font-bold text-lg">
            {account
              ? "Editar Conta"
              : "Nova Conta"}
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

            <label className="text-sm font-medium">

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

            <label className="text-sm font-medium">

              Tipo

            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(
                  e.target.value as AccountType
                )
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            >

              {ACCOUNT_TYPES.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

          </div>

          <div>

            <label className="text-sm font-medium">

              Saldo Inicial

            </label>

            <input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) =>
                setInitialBalance(
                  Number(e.target.value)
                )
              }
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2"
            />

          </div>

          <div>

            <label className="text-sm font-medium">

              Cor

            </label>

            <div className="flex flex-wrap gap-2 mt-2">

              {COLORS.map((item) => (

                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setColor(item)
                  }
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

          <div className="flex justify-end gap-2 border-t border-border pt-4">

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-border hover:bg-accent"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded bg-primary text-primary-foreground flex items-center gap-2"
            >
              <Save size={16} />

              {account
                ? "Salvar"
                : "Criar Conta"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
};