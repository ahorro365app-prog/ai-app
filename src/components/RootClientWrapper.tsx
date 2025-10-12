"use client";

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Navbar from './Navbar';
import TransactionModal from './TransactionModal';
import { useTransactions } from '@/contexts/TransactionsContext';

export default function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const { addTransaction } = useTransactions();

  // Ocultar Navbar en páginas de autenticación
  const hideNavigation = pathname === '/sign-in' || pathname === '/sign-up';

  const handleSaveTransaction = (transaction: any) => {
    addTransaction(transaction);
    setShowTransactionModal(false);
  };

  return (
    <>
      <main className="pb-0">
        {children}
      </main>
      {!hideNavigation && (
        <>
          <Navbar onOpenTransaction={() => setShowTransactionModal(true)} />
          <TransactionModal
            isOpen={showTransactionModal}
            onClose={() => setShowTransactionModal(false)}
            onSave={handleSaveTransaction}
          />
        </>
      )}
    </>
  );
}
