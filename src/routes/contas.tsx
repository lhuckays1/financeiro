import React, { useMemo, useState } from "react";
import { Landmark, Plus } from "lucide-react";

import { useAuth } from "../hooks/use-auth";
import {
  useAccounts,
  useAddAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "../hooks/useAccounts";

import { useTransactions } from "../hooks/use-finance-data";

import { Account } from "../types";

import { AccountCard } from "../components/AccountCard";
import { AccountModal } from "../components/AccountModal";
import { DeleteAccountDialog } from "../components/DeleteAccountDialog";

import { formatBRL } from "../lib/format";

export const ContasPage: React.FC = () => {
  const { user } = useAuth();

  const { data: accounts = [], isLoading } =
    useAccounts(user?.id);

  const { data: transactions = [] } =
    useTransactions(user?.id);

  const addAccountMutation =
    useAddAccount();

  const updateAccountMutation =
    useUpdateAccount();

  const deleteAccountMutation =
    useDeleteAccount(user?.id || "");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingAccount, setEditingAccount] =
    useState<Account | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);

  const [selectedAccount, setSelectedAccount] =
    useState<Account | null>(null);

  const accountBalances = useMemo(() => {

    const map = new Map<string, number>();

    accounts.forEach((account) => {

      let balance =
        Number(account.initial_balance);

      transactions.forEach((transaction: any) => {

        if (transaction.account_id !== account.id)
          return;

        const value =
          Number(transaction.amount);

        switch (transaction.type) {
            case "ganho":
                balance += value;
                break;

            case "gasto":
                balance -= value;
                break;
        }

      });

      map.set(account.id, balance);

    });

    return map;

  }, [accounts, transactions]);

  const handleCreate = () => {

    setEditingAccount(null);

    setModalOpen(true);

  };

  const handleEdit = (
    account: Account
  ) => {

    setEditingAccount(account);

    setModalOpen(true);

  };

  const handleDelete = (
    account: Account
  ) => {

    setSelectedAccount(account);

    setDeleteDialogOpen(true);

  };

  const handleSave = async (
    account: Omit<
      Account,
      "id" | "created_at" | "updated_at"
    >
  ) => {

    if (editingAccount) {

      await updateAccountMutation.mutateAsync({

        ...editingAccount,

        ...account,

      });

    } else {

      await addAccountMutation.mutateAsync({

        ...account,

        user_id: user!.id,

      });

    }

    setModalOpen(false);

    setEditingAccount(null);

  };

  const handleConfirmDelete =
    async (
      accountId: string,
      moveTo?: string
    ) => {

      await deleteAccountMutation.mutateAsync(
        accountId
      );

      setDeleteDialogOpen(false);

      setSelectedAccount(null);

    };

  if (isLoading) {

    return (

      <div className="flex items-center justify-center h-80">

        <p className="text-muted-foreground">

          Carregando contas...

        </p>

      </div>

    );

  }

  return (

    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold">

            Contas

          </h1>

          <p className="text-muted-foreground">

            Gerencie suas contas bancárias e carteiras.

          </p>

        </div>

        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition"
        >

          <Plus size={18} />

          Nova Conta

        </button>

      </div>

      {accounts.length === 0 ? (

        <div className="rounded-xl border border-dashed border-border p-10 text-center">

          <Landmark className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-semibold">

            Nenhuma conta cadastrada

          </h2>

          <p className="mt-2 text-muted-foreground">

            Clique em "Nova Conta" para começar.

          </p>

        </div>

      ) : (

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {accounts.map((account) => (

            <AccountCard
              key={account.id}
              account={account}
              balance={
                accountBalances.get(account.id) ?? 0
              }
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

          ))}

        </div>

      )}
            <AccountModal
        open={modalOpen}
        account={editingAccount}
        accounts={accounts}
        onClose={() => {
          setModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSave}
      />

      <DeleteAccountDialog
        open={deleteDialogOpen}
        account={selectedAccount}
        accounts={accounts}
        transactions={transactions}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedAccount(null);
        }}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default ContasPage;