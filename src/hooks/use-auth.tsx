import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import {
  neon,
  isNeonConfigured,
  getDemoUser,
  setDemoUser,
  getStoredCategories,
} from '../lib/neon';
import { toast } from 'sonner';
import { initializeUser } from "../services/profile.service";

async function toAppUser(authUser: any): Promise<AuthUser> {
  const id = await initializeUser(authUser);
  return {
    id,
    email: authUser.email || '',
    user_metadata: authUser.user_metadata ?? {},
    created_at: authUser.created_at,
  };
}

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
  signUpWithEmail: (email: string, pass: string) => Promise<{ success: boolean; loggedIn: boolean; requiresVerification?: boolean }>;
  verifyEmailOtp: (email: string, token: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNeonConfigured && neon) {
      const { data: sub } = neon.auth.onAuthStateChange((_event, session) => {
        void (async () => {
          try {
            setUser(session?.user ? await toAppUser(session.user) : null);
          } catch (err: any) {
            setUser(null);
            toast.error(`Não foi possível carregar seu perfil: ${err?.message || 'erro de conexão'}`);
          } finally {
            setLoading(false);
          }
        })();
      });

      void neon.auth.getSession().then(async ({ data }) => {
        try {
          setUser(data.session?.user ? await toAppUser(data.session.user) : null);
        } catch (err: any) {
          setUser(null);
          toast.error(`Não foi possível carregar seu perfil: ${err?.message || 'erro de conexão'}`);
        } finally {
          setLoading(false);
        }
      }).catch((err: any) => {
        setUser(null);
        setLoading(false);
        toast.error(`Falha ao recuperar a sessão: ${err?.message || 'erro de conexão'}`);
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
    if (isNeonConfigured && neon) {
      try {
        const { data, error } = await neon.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error) {
          toast.error(`Erro ao entrar: ${error.message}`);
          return false;
        }
        if (data.session?.user) {
          setUser(await toAppUser(data.session.user));
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
    if (isNeonConfigured && neon) {
      try {
        const { data, error } = await neon.auth.signUp({
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
          setUser(await toAppUser(data.session.user));
          toast.success('Conta criada e logada com sucesso!');
          return { success: true, loggedIn: true };
        }
        if (data.user) {
          toast.info('Conta criada. Informe o código enviado por e-mail para confirmar sua identidade.');
          return { success: true, loggedIn: false, requiresVerification: true };
        }

        return { success: true, loggedIn: false };
      } catch (err: any) {
        toast.error(`Erro no cadastro: ${err?.message || 'Falha ao comunicar com Neon'}`);
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

  const verifyEmailOtp = async (email: string, token: string) => {
    if (!neon) return false;
    try {
      const { data, error } = await neon.auth.verifyOtp({ email, token, type: 'signup' });
      if (error) throw error;
      if (!data.session?.user) throw new Error('A confirmação não iniciou uma sessão. Tente entrar novamente.');
      setUser(await toAppUser(data.session.user));
      toast.success('E-mail confirmado. Bem-vindo!');
      return true;
    } catch (err: any) {
      toast.error(`Não foi possível confirmar o e-mail: ${err?.message || 'código inválido'}`);
      return false;
    }
  };

  const signInWithGoogle = async () => {
    if (isNeonConfigured && neon) {
      try {
        const { data, error } = await neon.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error('O Neon não retornou a URL de autenticação.');
      } catch (err: any) {
        toast.error(`Falha ao iniciar login com Google: ${err?.message || 'provedor indisponível'}`);
        return;
      }
      return;
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
    if (isNeonConfigured && neon) {
      await neon.auth.signOut();
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
        verifyEmailOtp,
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

