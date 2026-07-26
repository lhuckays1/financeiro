import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { AppShell } from './components/AppShell';
import { AuthPage } from './routes/auth';
import { DashboardPage } from './routes/dashboard';
import { LancamentosPage } from './routes/lancamentos';
import { CategoriasPage } from './routes/categorias';
import { ConfiguracoesPage } from './routes/configuracoes';
import { AdminPage } from './routes/admin';
import ContasPage from "./routes/contas";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function MainApp() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('/dashboard');

  // Handle hash or history path change
  useEffect(() => {
    const getPathFromHash = () => {
      const hash = window.location.hash.replace('#', '');
      return hash || '/dashboard';
    };

    setCurrentPath(getPathFromHash());

    const handleHashChange = () => {
      setCurrentPath(getPathFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando Sistema Financeiro...</p>
        </div>
      </div>
    );
  }

  // Auth Guard
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" richColors />
        <AuthPage onSuccess={() => navigate('/dashboard')} />
      </QueryClientProvider>
    );
  }

  // Render main app with router
  const renderRoute = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case '/lancamentos':
        return <LancamentosPage />;
      case "/contas":
        return <ContasPage />;
      case '/categorias':
        return <CategoriasPage />;
      case '/admin':
        return <AdminPage onNavigate={navigate} />;
      case '/configuracoes':
        return <ConfiguracoesPage onLogout={() => navigate('/auth')} />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <AppShell currentPath={currentPath} onNavigate={navigate}>
        {renderRoute()}
      </AppShell>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
