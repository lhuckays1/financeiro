import React, { useState } from 'react';
import { Wallet, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      alert('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    if (tab === 'login') {
      const ok = await signInWithEmail(email, password);
      setLoading(false);
      if (ok) {
        onSuccess();
      }
    } else {
      const res = await signUpWithEmail(email, password);
      setLoading(false);
      if (res.success) {
        if (res.loggedIn) {
          onSuccess();
        } else {
          // Switch to login tab so user can log in with created credentials
          setTab('login');
        }
      }
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-md p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-md bg-primary/15 text-primary mb-1">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sistema Financeiro SaaS
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestão financeira inteligente para controle de receitas, despesas e orçamentos.
          </p>
        </div>

        {/* Auth Tabs */}
        <div className="grid grid-cols-2 p-1 bg-background border border-border rounded-md">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => setTab('login')}
            className={`py-2 text-sm font-semibold rounded-md transition-all ${
              tab === 'login'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => setTab('signup')}
            className={`py-2 text-sm font-semibold rounded-md transition-all ${
              tab === 'signup'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Senha (Mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-md bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border w-full"></div>
          <span className="bg-card px-3 text-xs text-muted-foreground uppercase font-medium absolute">
            ou
          </span>
        </div>

        {/* Google OAuth Official Button */}
        <button
          id="auth-google-btn"
          type="button"
          onClick={handleGoogleAuth}
          className="w-full py-2.5 px-4 rounded-md border border-border bg-background hover:bg-accent text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-3 shadow-xs"
        >
          {/* Official 4-color Google Icon */}
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.28-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>
      </div>
    </div>
  );
};
