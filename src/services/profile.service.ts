import { neon } from '../lib/neon';

type AuthIdentity = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

/**
 * Keeps existing financial rows attached to their original profile ID.
 * Neon password hashes cannot be migrated, so users authenticate with a
 * new Neon Auth account using the same verified email address.
 */
export async function initializeUser(user: AuthIdentity): Promise<string> {
  if (!neon) return user.id;

  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error('A autenticação não retornou um e-mail.');

  const { data: existingProfile, error: profileLookupError } = await neon
    .from('profiles')
    .select('id,email,full_name,created_at')
    .eq('email', email)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileLookupError) throw profileLookupError;

  const profileId = existingProfile?.id ?? user.id;
  if (!existingProfile) {
    const { error } = await neon.from('profiles').insert({
      id: profileId,
      email,
      full_name: String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split('@')[0]),
    });
    if (error) throw error;
  }

  const { data: accounts, error: accountLookupError } = await neon
    .from('accounts')
    .select('id')
    .eq('user_id', profileId)
    .limit(1);
  if (accountLookupError) throw accountLookupError;

  if (!accounts?.length) {
    const { error } = await neon.from('accounts').insert({
      user_id: profileId,
      name: 'Conta Principal',
      type: 'Conta Corrente',
      initial_balance: 0,
      color: '#2563eb',
    });
    if (error) throw error;
  }

  const { data: categories, error: categoryLookupError } = await neon
    .from('categories')
    .select('id')
    .eq('user_id', profileId)
    .limit(1);
  if (categoryLookupError) throw categoryLookupError;

  if (!categories?.length) {
    const defaults = [
      { name: 'Salário', type: 'ganho', color: '#22c55e' },
      { name: 'Freelance', type: 'ganho', color: '#16a34a' },
      { name: 'Investimentos', type: 'ganho', color: '#0ea5e9' },
      { name: 'Alimentação', type: 'gasto', color: '#ef4444' },
      { name: 'Transporte', type: 'gasto', color: '#f97316' },
      { name: 'Moradia', type: 'gasto', color: '#8b5cf6' },
      { name: 'Saúde', type: 'gasto', color: '#ec4899' },
      { name: 'Lazer', type: 'gasto', color: '#14b8a6' },
      { name: 'Assinaturas', type: 'gasto', color: '#a855f7' },
      { name: 'Outros', type: 'gasto', color: '#64748b' },
    ];
    const { error } = await neon.from('categories').insert(
      defaults.map((category) => ({ user_id: profileId, ...category })),
    );
    if (error) throw error;
  }

  return profileId;
}

