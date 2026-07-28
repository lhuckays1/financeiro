import { supabase } from "../lib/supabase";

export async function initializeUser(user: {
  id: string;
  email?: string;
  user_metadata?: any;
}) {
  if (!supabase) return;

  console.log("initializeUser", user.id);
  // ---------- PROFILE ----------
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name:
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "",
    });
  }

  // ---------- ACCOUNT ----------
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account) {
    await supabase.from("accounts").insert({
      user_id: user.id,
      name: "Conta Principal",
      type: "Conta Corrente",
      initial_balance: 0,
      color: "#2563eb",
      icon: "wallet",
    });
  }

  // ---------- CATEGORIES ----------
  const { count } = await supabase
    .from("categories")
    .select("*", {
      head: true,
      count: "exact",
    })
    .eq("user_id", user.id);

  if ((count ?? 0) === 0) {
    const categories = [
      { name: "Salário", type: "ganho", color: "#22c55e" },
      { name: "Freelance", type: "ganho", color: "#16a34a" },
      { name: "Investimentos", type: "ganho", color: "#0ea5e9" },
      { name: "Outros", type: "ganho", color: "#64748b" },

      { name: "Alimentação", type: "gasto", color: "#ef4444" },
      { name: "Transporte", type: "gasto", color: "#f97316" },
      { name: "Moradia", type: "gasto", color: "#8b5cf6" },
      { name: "Saúde", type: "gasto", color: "#ec4899" },
      { name: "Educação", type: "gasto", color: "#3b82f6" },
      { name: "Lazer", type: "gasto", color: "#14b8a6" },
      { name: "Assinaturas", type: "gasto", color: "#a855f7" },
      { name: "Outros", type: "gasto", color: "#64748b" },
    ];

    await supabase.from("categories").insert(
      categories.map((c) => ({
        user_id: user.id,
        ...c,
      }))
    );
  }
}