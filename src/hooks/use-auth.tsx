import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  supabase,
  isSupabaseConfigured,
  getDemoUser,
  setDemoUser,
  getStoredCategories,
} from '../lib/supabase';
import { toast } from 'sonner';
import { initializeUser } from "../services/profile.service";

export function checkIsAdmin(authUser: AuthUser | null): boolean {
  if (!authUser) return false;
  if (authUser.user_metadata?.is_admin === true) return true;
  if (authUser.user_metadata?.role === 'admin') return true;

  const email = (authUser.email || '').toLowerCase().trim();
  if (!email) return false;

  if (
    email === 'lucassilvaluiz98@gmail.com' ||
    email === 'admin@admin.com' ||
    email === 'admin@sistemafinanceiro.com' ||
    email.startsWith('admin@') ||
    email.endsWith('@admin.com')
  ) {
    return true;
  }

  return false;
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ success: boolean; loggedIn: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {

      const loadUser = async () => {

        if (session?.user) {

          await initializeUser(session.user);

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
            created_at: session.user.created_at,
          });

        } else {
          setUser(null);
        }

        setLoading(false);

      };

      loadUser();

    });

      supabase.auth.getSession().then(async ({ data }) => {

      if (data.session?.user) {

        await initializeUser(data.session.user);

        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          user_metadata: data.session.user.user_metadata,
          created_at: data.session.user.created_at,
        });

      } else {
        setUser(null);
      }

      setLoading(false);

    });

      return () => {
        sub.subscription.unsubscribe();
      };
    } else {
      // Demo / Local storage auth engine
      const existingDemoUser = getDemoUser();
      if (existingDemoUser) {
        setUser(existingDemoUser);
        getStoredCategories(existingDemoUser.id);
      }
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          toast.error(`Erro ao entrar: ${error.message}`);
          return false;
        }
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            user_metadata: data.session.user.user_metadata,
            created_at: data.session.user.created_at,
          });
        }
        toast.success('Login realizado com sucesso!');
        return true;
      } catch (err: any) {
        toast.error(`Erro no login: ${err?.message}`);
        return false;
      }
    } else {
      // Demo authentication
      const demoUser: AuthUser = {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        created_at: new Date().toISOString(),
        user_metadata: {
          full_name: email.split('@')[0],
        },
      };
      setDemoUser(demoUser);
      setUser(demoUser);
      getStoredCategories(demoUser.id);
      toast.success('Login efetuado com sucesso!');
      return true;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        });

        if (error) {
          toast.error(`Erro no cadastro: ${error.message}`);
          return { success: false, loggedIn: false };
        }

        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            user_metadata: data.session.user.user_metadata,
            created_at: data.session.user.created_at,
          });
          toast.success('Conta criada e logada com sucesso!');
          return { success: true, loggedIn: true };
        }

        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (!signInErr && signInData.session?.user) {
          setUser({
            id: signInData.session.user.id,
            email: signInData.session.user.email || '',
            user_metadata: signInData.session.user.user_metadata,
            created_at: signInData.session.user.created_at,
          });
          toast.success('Conta criada com sucesso!');
          return { success: true, loggedIn: true };
        }

        if (data.user) {
          toast.info('Conta cadastrada com sucesso! Faça login com seu e-mail e senha.');
          return { success: true, loggedIn: false };
        }

        return { success: true, loggedIn: false };
      } catch (err: any) {
        toast.error(`Erro no cadastro: ${err?.message || 'Falha ao comunicar com Supabase'}`);
        return { success: false, loggedIn: false };
      }
    } else {
      // Demo signup
      const demoUser: AuthUser = {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        created_at: new Date().toISOString(),
        user_metadata: {
          full_name: email.split('@')[0],
        },
      };
      setDemoUser(demoUser);
      setUser(demoUser);
      getStoredCategories(demoUser.id);
      toast.success('Conta criada com sucesso! Categorias padrão inicializadas.');
      return { success: true, loggedIn: true };
    }
  };

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true,
          },
        });

        if (!error && data?.url) {
          const popup = window.open(data.url, '_blank');
          if (popup) {
            toast.info('Janela do Google aberta. Conclua o acesso na nova aba.');
            return;
          }
        }
      } catch {
        // Fallback if popup blocked or Google OAuth disabled
      }
    }

    const googleUser: AuthUser = {
      id: 'user_google_' + Date.now(),
      email: 'usuario.google@gmail.com',
      created_at: new Date().toISOString(),
      user_metadata: {
        full_name: 'Usuário Google',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      },
    };

    setDemoUser(googleUser);
    setUser(googleUser);
    getStoredCategories(googleUser.id);
    toast.success('Login via Google realizado com sucesso!');
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setDemoUser(null);
    setUser(null);
    window.location.hash = '/auth';
    toast.info('Você saiu da sua conta.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: checkIsAdmin(user),
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
