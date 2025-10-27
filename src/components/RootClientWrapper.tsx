"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Navbar from './Navbar';
import TransactionModal from './TransactionModal';
import OrientationLock from './OrientationLock';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { useStatusBar } from '@/contexts/StatusBarContext';
import { useVoice } from '@/contexts/VoiceContext';
import { StatusBar, Style } from '@capacitor/status-bar';

export default function RootClientWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const { addTransaction } = useSupabase();
  const { isAnyModalOpen } = useModal();
  const { setStatusBarConfig } = useStatusBar();
  const { setVoiceData } = useVoice();

  // Ocultar Navbar en páginas de autenticación o cuando hay modales abiertos
  const hideNavigation = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up') || isAnyModalOpen;
  
  console.log('RootClientWrapper: isAnyModalOpen:', isAnyModalOpen, 'hideNavigation:', hideNavigation, 'display style:', hideNavigation ? 'none' : 'block');
  console.log('RootClientWrapper: pathname:', pathname, 'startsWith /sign-in:', pathname.startsWith('/sign-in'), 'startsWith /sign-up:', pathname.startsWith('/sign-up'));

  // Función para manejar el procesamiento de voz desde el Navbar
  const handleVoiceProcessed = (transcriptionText: string, groqData: any) => {
    console.log('🎤 RootClientWrapper: Recibido audio procesado del Navbar');
    // Usar el contexto de voz para comunicar con el dashboard
    setVoiceData({
      transcriptionText,
      groqData,
      source: 'audio'
    });
  };

  // Memoizar la función de configuración de la barra de estado
  const getStatusBarConfig = useCallback(() => {
    // Páginas de autenticación - fondo blanco
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return {
        backgroundColor: '#ffffff',
        style: Style.Dark
      };
    }
    
    // Dashboard - fondo azul claro
    if (pathname === '/dashboard') {
      return {
        backgroundColor: '#dbeafe', // blue-100
        style: Style.Dark
      };
    }
    
    // Deudas - fondo rojo claro
    if (pathname === '/deudas') {
      return {
        backgroundColor: '#fee2e2', // red-100
        style: Style.Dark
      };
    }
    
    // Metas - fondo púrpura claro
    if (pathname === '/metas') {
      return {
        backgroundColor: '#f3e8ff', // purple-100
        style: Style.Dark
      };
    }
    
    // Historial - fondo verde claro
    if (pathname === '/history') {
      return {
        backgroundColor: '#dcfce7', // green-100
        style: Style.Dark
      };
    }
    
    // Perfil - fondo gris claro
    if (pathname === '/profile') {
      return {
        backgroundColor: '#f9fafb', // gray-50
        style: Style.Dark
      };
    }
    
    // Por defecto - fondo blanco
    return {
      backgroundColor: '#ffffff',
      style: Style.Dark
    };
  }, [pathname]);

  // Función para obtener el color de fondo de la página actual
  const getPageBackgroundColor = useCallback(() => {
    // Páginas de autenticación - fondo blanco
    if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
      return 'bg-white';
    }
    
    // Dashboard - gradiente azul-púrpura (continuación del header)
    if (pathname === '/dashboard') {
      return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
    
    // Deudas - gradiente rojo-naranja (continuación del header)
    if (pathname === '/deudas') {
      return 'bg-gradient-to-r from-red-600 to-orange-600';
    }
    
    // Metas - gradiente púrpura-rosa (continuación del header)
    if (pathname === '/metas') {
      return 'bg-gradient-to-r from-purple-600 to-pink-600';
    }
    
    // Historial - gradiente púrpura-azul (continuación del header)
    if (pathname === '/history') {
      return 'bg-gradient-to-r from-purple-600 to-blue-600';
    }
    
    // Perfil - gradiente azul-púrpura (continuación del header)
    if (pathname === '/profile') {
      return 'bg-gradient-to-r from-blue-600 to-purple-600';
    }
    
    // Por defecto - fondo blanco
    return 'bg-white';
  }, [pathname]);

  // Configurar barra de estado según la página actual
  useEffect(() => {
    const config = getStatusBarConfig();
    setStatusBarConfig(config);
  }, [getStatusBarConfig, setStatusBarConfig]);

  const handleSaveTransaction = async (transaction: any) => {
    try {
      // Validar campos requeridos
      if (!transaction.type || !transaction.amount || !transaction.category) {
        throw new Error('Faltan campos requeridos: type, amount, category');
      }

      const transactionData = {
        tipo: transaction.type === 'expense' ? 'gasto' : 'ingreso',
        monto: parseFloat(transaction.amount),
        categoria: transaction.category,
        descripcion: transaction.description || '',
        fecha: transaction.date,
        url_comprobante: transaction.receipt_url || null
      };

      console.log('RootClientWrapper: Saving transaction with data:', transactionData);
      await addTransaction(transactionData);
      setShowTransactionModal(false);
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Original transaction data:', transaction);
    }
  };

  return (
    <div className={`min-h-screen ${getPageBackgroundColor()}`}>
      <OrientationLock />
      <main className={`${pathname === '/history' ? 'pt-0' : 'pt-8'} pb-0`}>
        {children}
      </main>
      <div 
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ display: hideNavigation ? 'none' : 'block' }}
      >
        <Navbar 
          onOpenTransaction={() => setShowTransactionModal(true)} 
          hideBottomBar={hideNavigation}
          onVoiceProcessed={handleVoiceProcessed}
        />
      </div>
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
