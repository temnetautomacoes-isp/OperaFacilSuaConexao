import React from 'react';
import { RelatoriosFinanceiroSection } from './RelatoriosFinanceiroSection';

export const RelatoriosModule: React.FC = () => {
  return (
    <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-58px)]">
      <RelatoriosFinanceiroSection />
    </div>
  );
};
