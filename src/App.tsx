import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { ColaboradorView } from './components/colaborador/ColaboradorView';
import { ErpView } from './components/erp/ErpView';
import { LoginView } from './components/auth/LoginView';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { environment, currentUser } = useApp();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FF] text-slate-800 antialiased font-sans select-none">
      {/* Top Header Bar */}
      <TopBar />

      {/* Main Workspace Area (Colaborador or ERP) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {environment === 'colaborador' || environment === 'pdv' ? <ColaboradorView /> : <ErpView />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}


