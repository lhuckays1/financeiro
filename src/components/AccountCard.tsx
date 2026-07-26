import React from "react";
import {
  Pencil,
  Trash2,
  Landmark,
} from "lucide-react";

import { Account } from "../types";
import { formatBRL } from "../lib/format";

interface Props {
  account: Account;

  balance: number;

  onEdit: (account: Account) => void;

  onDelete: (account: Account) => void;
}

export const AccountCard: React.FC<Props> = ({
  account,
  balance,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">

      <div className="flex justify-between">

        <div className="flex gap-3">

          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
            style={{
              backgroundColor: account.color,
            }}
          >
            <Landmark size={20} />
          </div>

          <div>

            <h3 className="font-semibold">
              {account.name}
            </h3>

            <p className="text-sm text-muted-foreground">
              {account.type}
            </p>

          </div>

        </div>

        <div className="flex gap-1">

          <button
            onClick={() => onEdit(account)}
            className="p-2 rounded hover:bg-accent"
          >
            <Pencil size={17} />
          </button>

          <button
            onClick={() => onDelete(account)}
            className="p-2 rounded text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={17} />
          </button>

        </div>

      </div>

      <div className="mt-5">

        <span className="text-xs text-muted-foreground">

          Saldo Atual

        </span>

        <div className="text-2xl font-bold mt-1">

          {formatBRL(balance)}

        </div>

      </div>

    </div>
  );
};