"use client";

import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import Navbar from './Navbar';
import TransactionModal from './TransactionModal';
import OrientationLock from './OrientationLock';
import LoadingScreen from './LoadingScreen';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { useStatusBar } from '@/contexts/StatusBarContext';
import { useVoice } from '@/contexts/VoiceContext';
import { useRegisterFcmToken } from '@/hooks/useRegisterFcmToken';
import { StatusBar, Style } from '@capacitor/status-bar';
import VersionCheckWrapper from './VersionCheckWrapper';

export default function RootClientWrapper({ children }: { children: React.ReactNode }) {
  // Componente iniciando - log removido para producción
  
  const pathname = usePathname();
    // Pathname obtenido - log removido para producción
  
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [dashboardModule, setDashboardModule] = useState<any>(null);
  const [signInModule, setSignInModule] = useState<any>(null);
  const [signUpModule, setSignUpModule] = useState<any>(null);
  const [historyModule, setHistoryModule] = useState<any>(null);
  const [deudasModule, setDeudasModule] = useState<any>(null);
  const [metasModule, setMetasModule] = useState<any>(null);
  const [profileModule, setProfileModule] = useState<any>(null);
  const [referralsModule, setReferralsModule] = useState<any>(null);
  const [billingModule, setBillingModule] = useState<any>(null);
    // Estado inicial configurado - log removido para producción
  
      // Intentando usar useSupabase - log removido para producción
  const { addTransaction, loading, user } = useSupabase();
  const { isAnyModalOpen } = useModal();
  const { setStatusBarConfig } = useStatusBar();
  const { setVoiceData } = useVoice();
  
  // Registrar token FCM cuando el usuario esté autenticado
  useRegisterFcmToken();

  // Ocultar Navbar en páginas de autenticación, billing/pago, referidos, historial completo o cuando hay modales abiertos
  const hideNavigation = 
    pathname.startsWith('/sign-in') || 
    pathname.startsWith('/sign-up') || 
    pathname.startsWith('/billing/payment-methods') ||
    pathname.startsWith('/billing/pay') ||
    pathname.startsWith('/referrals') ||
    pathname.startsWith('/history/full') ||
    isAnyModalOpen;
  

  // Función para manejar el procesamiento de voz desde el Navbar
  const handleVoiceProcessed = (transcriptionText: string, groqData: any) => {
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

      await addTransaction(transactionData);
      setShowTransactionModal(false);
    } catch (error) {
      // Error al guardar transacción - manejado por el contexto
    }
  };

  // Mostrar loading screen mientras se carga el contexto
  // Solo mostrar en rutas que no sean de autenticación
  const shouldShowLoading = loading && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up');
  
  
      // Log adicional para ver qué children se están pasando
      if (children) {
        const child = children as any;
        const childInfo: any = {
          type: typeof children,
          isArray: Array.isArray(children),
          isNull: children === null,
          isUndefined: children === undefined,
        };
        
        // Intentar inspeccionar más profundamente si es un objeto
        if (typeof children === 'object' && children !== null) {
          childInfo.$$typeof = child.$$typeof;
          childInfo.hasType = !!child.type;
          childInfo.typeName = child.type?.name || child.type?.displayName || (typeof child.type === 'function' ? 'Function' : typeof child.type) || 'unknown';
          childInfo.hasProps = !!child.props;
          childInfo.propsKeys = child.props ? Object.keys(child.props) : null;
          childInfo.hasKey = !!child.key;
          childInfo.hasRef = !!child.ref;
          
          // Intentar obtener más información sobre el tipo
          if (child.type) {
            if (typeof child.type === 'function') {
              childInfo.typeFunctionName = child.type.name || 'anonymous';
              childInfo.typeIsComponent = child.type.prototype?.isReactComponent !== undefined;
            } else if (typeof child.type === 'string') {
              childInfo.typeString = child.type;
            }
          }
        }
        
      }

      // Pre-cargar los módulos de las páginas principales cuando estamos en esas rutas
      // Esto fuerza que los módulos estén disponibles antes de que React intente renderizarlos
      useEffect(() => {
        // Pre-cargar dashboard
        if (pathname === '/dashboard/') {
          import('@/app/dashboard/page').then((module) => {
            (window as any).__DASHBOARD_MODULE_PRELOADED__ = true;
            (window as any).__DASHBOARD_MODULE__ = module;
            setDashboardModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo del dashboard
          });
        } else {
          setDashboardModule(null);
        }
        
        // Pre-cargar sign-in (verificar ambas variantes de pathname)
        if (pathname === '/sign-in/' || pathname === '/sign-in') {
          import('@/app/sign-in/page').then((module) => {
            (window as any).__SIGNIN_MODULE_PRELOADED__ = true;
            (window as any).__SIGNIN_MODULE__ = module;
            setSignInModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de sign-in
          });
        } else {
          setSignInModule(null);
        }
        
        // Pre-cargar sign-up
        if (pathname === '/sign-up/' || pathname === '/sign-up') {
          import('@/app/sign-up/page').then((module) => {
            (window as any).__SIGNUP_MODULE_PRELOADED__ = true;
            (window as any).__SIGNUP_MODULE__ = module;
            setSignUpModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de sign-up
          });
        } else {
          setSignUpModule(null);
        }
        
        // Pre-cargar history
        if (pathname === '/history/' || pathname === '/history') {
          import('@/app/history/page').then((module) => {
            setHistoryModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de history
          });
        } else {
          setHistoryModule(null);
        }
        
        // Pre-cargar deudas
        if (pathname === '/deudas/' || pathname === '/deudas') {
          import('@/app/deudas/page').then((module) => {
            setDeudasModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de deudas
          });
        } else {
          setDeudasModule(null);
        }
        
        // Pre-cargar metas
        if (pathname === '/metas/' || pathname === '/metas') {
          import('@/app/metas/page').then((module) => {
            setMetasModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de metas
          });
        } else {
          setMetasModule(null);
        }
        
        // Pre-cargar profile
        if (pathname === '/profile/' || pathname === '/profile') {
          import('@/app/profile/page').then((module) => {
            setProfileModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de profile
          });
        } else {
          setProfileModule(null);
        }
        
        // Pre-cargar referrals
        if (pathname === '/referrals/' || pathname === '/referrals') {
          import('@/app/referrals/page').then((module) => {
            setReferralsModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de referrals
          });
        } else {
          setReferralsModule(null);
        }
        
        // Pre-cargar billing
        if (pathname === '/billing/' || pathname === '/billing') {
          import('@/app/billing/page').then((module) => {
            setBillingModule(module);
          }).catch(() => {
            // Error al pre-cargar módulo de billing
          });
        } else {
          setBillingModule(null);
        }
      }, [pathname]);

      // Verificar si el componente del dashboard se ha ejecutado
      useEffect(() => {
        if (pathname === '/dashboard/' && !loading && user) {
          const checkComponentExecution = () => {
            const moduleLoaded = (window as any).__DASHBOARD_MODULE_LOADED__;
            const componentExecuted = (window as any).__DASHBOARD_COMPONENT_EXECUTED__;
            const componentExecutedTime = (window as any).__DASHBOARD_COMPONENT_EXECUTED_TIME__;
            
            const modulePreloaded = (window as any).__DASHBOARD_MODULE_PRELOADED__;
            
            const checkInfo = {
              moduleLoaded,
              modulePreloaded,
              componentExecuted,
              componentExecutedTime: componentExecutedTime ? new Date(componentExecutedTime).toISOString() : null,
              pathname,
              loading,
              hasUser: !!user,
              reactVersion: (window as any).React?.version || 'unknown',
            };
            
          };
          
          // Verificar inmediatamente y después de delays progresivos
          checkComponentExecution();
          const timeouts = [
            setTimeout(checkComponentExecution, 100),
            setTimeout(checkComponentExecution, 500),
            setTimeout(checkComponentExecution, 1000),
            setTimeout(checkComponentExecution, 2000),
            setTimeout(checkComponentExecution, 3000)
          ];
          
          return () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
          };
        }
      }, [pathname, loading, user]);

      return (
        <div className={`min-h-screen ${getPageBackgroundColor()}`}>
          {/* LoadingScreen encima cuando está cargando, pero children siempre renderizados */}
          {shouldShowLoading && <LoadingScreen />}
          <OrientationLock />
          <main className={`${pathname === '/history' ? 'pt-0' : 'pt-8'} pb-0`}>
            {(() => {
              // Si estamos en dashboard y el módulo está pre-cargado, renderizar directamente
              if (pathname === '/dashboard/' && dashboardModule?.default) {
                const DashboardComponent = dashboardModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <DashboardComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en sign-in y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/sign-in/' || pathname === '/sign-in') && signInModule?.default) {
                const SignInComponent = signInModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <SignInComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en sign-up y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/sign-up/' || pathname === '/sign-up') && signUpModule?.default) {
                const SignUpComponent = signUpModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <SignUpComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en history y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/history/' || pathname === '/history') && historyModule?.default) {
                const HistoryComponent = historyModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <HistoryComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en deudas y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/deudas/' || pathname === '/deudas') && deudasModule?.default) {
                const DeudasComponent = deudasModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <DeudasComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en metas y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/metas/' || pathname === '/metas') && metasModule?.default) {
                const MetasComponent = metasModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <MetasComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en profile y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/profile/' || pathname === '/profile') && profileModule?.default) {
                const ProfileComponent = profileModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <ProfileComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en referrals y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/referrals/' || pathname === '/referrals') && referralsModule?.default) {
                const ReferralsComponent = referralsModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <ReferralsComponent />
                  </Suspense>
                );
              }
              
              // Si estamos en billing y el módulo está pre-cargado, renderizar directamente
              if ((pathname === '/billing/' || pathname === '/billing') && billingModule?.default) {
                const BillingComponent = billingModule.default;
                return (
                  <Suspense fallback={<LoadingScreen />}>
                    <BillingComponent />
                  </Suspense>
                );
              }
              
              // Renderizar children normalmente envuelto en Suspense para manejar lazy components
              return (
                <Suspense fallback={<LoadingScreen />}>
                  {children}
                </Suspense>
              );
            })()}
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
      {/* Verificación de versión de la app */}
      <VersionCheckWrapper />
    </div>
  );
}
