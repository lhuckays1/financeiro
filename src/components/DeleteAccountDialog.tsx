import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import { Account, Transaction } from "../types";

interface Props {
  open: boolean;

  account: Account | null;

  accounts: Account[];

  transactions: Transaction[];

  onClose: () => void;

  onDelete: (
    accountId: string,
    moveTo?: string
  ) => Promise<void>;
}

export const DeleteAccountDialog: React.FC<Props> = ({
  open,
  account,
  accounts,
  transactions,
  onClose,
  onDelete,
}) => {
  const [moveTo, setMoveTo] = useState("");

  useEffect(() => {
    if (open) {
      setMoveTo("");
    }
  }, [open]);

  const usedTransactions = useMemo(() => {
    if (!account) return [];

    return transactions.filter(
      (t: any) =>
        t.account_id === account.id
    );
  }, [transactions, account]);

  const availableAccounts = useMemo(() => {
    if (!account) return [];

    return accounts.filter(
      (a) =>
        a.id !== account.id &&
        a.is_active
    );
  }, [accounts, account]);

  if (!open || !account) return null;

  const handleDelete = async () => {

    if (
      usedTransactions.length > 0 &&
      availableAccounts.length === 0
    ) {
      alert(
        "Crie outra conta antes de desativar esta."
      );
      return;
    }

    if (
      usedTransactions.length > 0 &&
      !moveTo
    ) {
      alert(
        "Selecione a conta que receberá os lançamentos."
      );
      return;
    }

    await onDelete(
      account.id,
      moveTo || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">

      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">

        <div className="p-5 border-b border-border flex items-center gap-3">

          <AlertTriangle className="text-destructive" />

          <h2 className="font-bold text-lg">
            Desativar Conta
          </h2>

        </div>

        <div className="p-5 space-y-5">

          <div>

            <p className="text-sm text-muted-foreground">
              Conta
            </p>

            <p className="font-bold mt-1">
              {account.name}
            </p>

          </div>

          {usedTransactions.length === 0 ? (

            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">

              <p className="text-sm text-destructive">
                Esta conta não possui lançamentos.
              </p>

            </div>

          ) : (

            <>
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">

                <p className="text-sm text-yellow-700 dark:text-yellow-300">

                  Esta conta possui

                  <strong>

                    {" "}
                    {usedTransactions.length} lançamento(s)

                  </strong>

                </p>

              </div>

              {availableAccounts.length > 0 ? (

                <div>

                  <label className="text-sm font-medium">

                    Transferir lançamentos para

                  </label>

                  <select
                    value={moveTo}
                    onChange={(e) =>
                      setMoveTo(e.target.value)
                    }
                    className="mt-2 w-full rounded border border-border bg-background px-3 py-2"
                  >

                    <option value="">
                      Selecione...
                    </option>

                    {availableAccounts.map(
                      (item) => (

                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

              ) : (

                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">

                  <p className="text-sm text-destructive">

                    Não existe outra conta para receber os lançamentos.

                  </p>

                </div>

              )}

            </>

          )}

        </div>

        <div className="border-t border-border p-4 flex justify-end gap-2">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-border hover:bg-accent"
          >
            Cancelar
          </button>

          <button
            onClick={handleDelete}
            className="px-5 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2"
          >

            <Trash2 size={16} />

            Desativar

          </button>

        </div>

      </div>

    </div>
  );
};