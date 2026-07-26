import React, { useEffect } from 'react';
import {
  Wallet,
  Landmark,
  LayoutDashboard,
  Receipt,
  Grid,
  Settings,
  Sun,
  Moon,
  Plus,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useThemeStore } from '../store/theme-store';
import { useTransactionModalStore } from '../store/transaction-modal-store';
import { useAuth } from '../hooks/use-auth';
import { TransactionModal } from './TransactionModal';

interface AppShellProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/lancamentos', label: 'Lançamentos', icon: Receipt },
  { path: '/categorias', label: 'Categorias', icon: Grid },
  { path: '/contas', label: 'Contas', icon: Landmark },
  { path: '/admin', label: 'Área ADM', icon: ShieldAlert, badge: 'SaaS' },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

export const AppShell: React.FC<AppShellProps> = ({ currentPath, onNavigate, children }) => {
  const { theme, toggleTheme } = useThemeStore();
  const { openModal } = useTransactionModalStore();
  const { user, signOut, isAdmin } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.path === '/admin') {
      return isAdmin;
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    onNavigate('/auth');
  };

  // Shortcut key 'N' listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, select or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openModal(null, 'gasto');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Desktop Sidebar (Fixed Left w-64) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/dashboard')}>
            <div className="p-2.5 rounded-lg bg-primary/15 text-primary">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-foreground leading-tight">
                Sistema Financeiro
              </h1>
              <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">
                Gestão SaaS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                id={`nav-link-${item.path.replace('/', '')}`}
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with User & Controls */}
        <div className="p-3.5 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs text-foreground font-medium truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="theme-toggle-desktop-btn"
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-border text-foreground hover:bg-accent transition-colors"
              title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              id="logout-sidebar-btn"
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/15 transition-colors"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/dashboard')}>
          <div className="p-2 rounded-md bg-primary/15 text-primary">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            Sistema Financeiro
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="theme-toggle-mobile-btn"
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-md border border-border text-foreground hover:bg-accent"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
          <button
            id="logout-mobile-btn"
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/15"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 min-h-screen">
        {/* Content Locking: If trial is expired and path is not /planos or /admin, show paywall */}
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              id={`mobile-nav-${item.path.replace('/', '')}`}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Action Button (FAB) */}
      <button
        id="fab-new-transaction-btn"
        type="button"
        onClick={() => openModal(null, 'gasto')}
        className="fixed bottom-20 md:bottom-8 right-5 md:right-8 z-40 p-4 rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-95 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        title="Novo Lançamento (Atalho: Pressione 'N')"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 text-sm font-semibold">
          Novo Lançamento (N)
        </span>
      </button>

      {/* Transaction Modal */}
      <TransactionModal />
    </div>
  );
};

