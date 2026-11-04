import React, { useState, useEffect } from 'react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { AuthProvider, useAuth } from './hooks/use-auth';
import { AppShell } from './components/AppShell';
import { AuthPage } from './routes/auth';
import { DashboardPage } from './routes/dashboard';
import { LancamentosPage } from './routes/lancamentos';
import { CategoriasPage } from './routes/categorias';
import { ConfiguracoesPage } from './routes/configuracoes';
import { AdminPage } from './routes/admin';
import ContasPage from "./routes/contas";
import CartoesPage from './routes/cartoes';
import ContasAPagarPage from './routes/contas-a-pagar';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Falha ao atualizar dados financeiros:', error);
      // Mutations already show their own messages. This reports failed reads,
      // which used to be hidden behind stale demo data.
      toast.error(`Não foi possível atualizar os dados: ${error.message || 'verifique sua conexão e tente novamente.'}`);
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 0,
      retry: 1,
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
    return <AuthPage onSuccess={() => navigate('/dashboard')} />;
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
      case '/cartoes':
        return <CartoesPage />;
      case '/contas-a-pagar':
        return <ContasAPagarPage />;
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
    <AppShell currentPath={currentPath} onNavigate={navigate}>
      {renderRoute()}
    </AppShell>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <MainApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

