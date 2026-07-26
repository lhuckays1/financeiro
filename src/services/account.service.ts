import { supabase } from "../lib/supabase";
import { Account } from "../types";

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []) as Account[];
}

export async function createAccount(
  account: Omit<
    Account,
    "id" | "created_at" | "updated_at"
  >
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert(account)
    .select()
    .single();

  if (error) throw error;

  return data as Account;
}

export async function updateAccount(
  account: Account
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update({
      name: account.name,
      type: account.type,
      color: account.color,
      initial_balance: account.initial_balance,
      is_active: account.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", account.id)
    .eq("user_id", account.user_id)
    .select()
    .single();

  if (error) throw error;

  return data as Account;
}

export async function deleteAccount(
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}