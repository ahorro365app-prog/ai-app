"use client";

import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useAppVersion } from '@/hooks/useAppVersion';
import UpdateModal from './UpdateModal';

/**
 * Componente wrapper que verifica la versión de la app y muestra el modal de actualización si es necesario
 * Este componente debe estar en el layout principal o en RootClientWrapper
 */
export default function VersionCheckWrapper() {
  const { versionCheck, isLoading, shouldShowModal } = useVersionCheck();
  const { platform } = useAppVersion();

  // BYPASS: En desarrollo, verificar si el usuario desactivó el modal manualmente
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  // En desarrollo, verificar si hay un flag para desactivar el modal
  const bypassVersionCheck = isDevelopment && 
    typeof window !== 'undefined' && 
    localStorage.getItem('bypassVersionCheck') === 'true';

  // No mostrar nada si está cargando o no hay información
  if (isLoading || !versionCheck || !shouldShowModal || bypassVersionCheck) {
    return null;
  }

  return (
    <UpdateModal
      isOpen={shouldShowModal}
      onClose={versionCheck.isRequired ? undefined : () => {
        // Guardar timestamp para no molestar por X horas
        if (typeof window !== 'undefined') {
          localStorage.setItem('versionCheckDismissed', Date.now().toString());
        }
      }}
      title={versionCheck.title || 'Actualización disponible'}
      message={versionCheck.message || 'Hay una nueva versión disponible.'}
      releaseNotes={versionCheck.releaseNotes}
      isRequired={versionCheck.isRequired}
      storeUrl={versionCheck.storeUrl}
      platform={platform}
    />
  );
}
