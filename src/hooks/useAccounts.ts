import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Account } from "../types";
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "../services/account.service";

export function useAccounts(userId?: string) {
  return useQuery({
    queryKey: ["accounts", userId],
    queryFn: () => getAccounts(userId!),
    enabled: !!userId,
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["accounts", variables.user_id],
      });

      toast.success("Conta criada com sucesso.");
    },

    onError(error: any) {
      toast.error(error.message);
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["accounts", data.user_id],
      });

      toast.success("Conta atualizada.");
    },

    onError(error: any) {
      toast.error(error.message);
    },
  });
}

export function useDeleteAccount(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(id, userId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts", userId],
      });

      toast.success("Conta removida.");
    },

    onError(error: any) {
      toast.error(error.message);
    },
  });
}