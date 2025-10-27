"use client";

import { useEffect } from 'react';
import { AlertCircle, X, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
}

export default function ErrorModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'error' 
}: ErrorModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return AlertCircle;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-red-500';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return 'border-green-200';
      case 'warning': return 'border-yellow-200';
      case 'info': return 'border-blue-200';
      default: return 'border-red-200';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50';
      case 'warning': return 'bg-yellow-50';
      case 'info': return 'bg-blue-50';
      default: return 'bg-red-50';
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'success': return '¡Éxito!';
      case 'warning': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Error';
    }
  };

  const IconComponent = getIcon();
  const displayTitle = title || getDefaultTitle();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300 border-2 ${getBorderColor()} transform scale-100 hover:scale-[1.02] transition-transform`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${getBorderColor()} ${getBackgroundColor()}`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${getBackgroundColor()} border-2 ${getBorderColor()}`}>
              <IconComponent size={20} className={getIconColor()} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900" style={{ fontSize: '20px' }}>{displayTitle}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed text-center text-sm">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 text-sm ${
              type === 'success' 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : type === 'warning'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : type === 'info'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {type === 'success' ? '¡Perfecto!' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
