"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'qr' | 'other';
  description: string;
  date: string;
}

interface TransactionsContextType {
  transactions: Transaction[];
  isLoading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  getTransactionsByDate: (date: Date) => Transaction[];
  getTodayTransactions: () => Transaction[];
  getStats: (txs: Transaction[]) => {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar transacciones desde localStorage al iniciar
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const saved = localStorage.getItem('transactions');
        if (saved) {
          setTransactions(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Guardar transacciones en localStorage cuando cambien
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoading]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Obtener transacciones filtradas por fecha
  const getTransactionsByDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return transactions.filter(t => {
      const txDate = new Date(t.date).toISOString().split('T')[0];
      return txDate === dateStr;
    });
  };

  // Obtener transacciones de hoy
  const getTodayTransactions = () => {
    return getTransactionsByDate(new Date());
  };

  // Calcular totales
  const getStats = (txs: Transaction[]) => {
    const totalIncome = txs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = txs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      balance,
    };
  };

  const value: TransactionsContextType = {
    transactions,
    isLoading,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getTransactionsByDate,
    getTodayTransactions,
    getStats,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}
