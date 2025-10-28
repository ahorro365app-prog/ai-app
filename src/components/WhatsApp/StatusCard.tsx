'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

interface StatusData {
  status: 'connected' | 'disconnected';
  uptime: number;
  number: string;
  lastSync: string;
}

export default function StatusCard() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setData(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/status', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reconnect' })
      });
      const result = await res.json();
      alert(result.message || 'Reconectando...');
      setTimeout(() => fetchStatus(), 5000);
    } catch (error) {
      alert('Reconnection failed');
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  const isConnected = data?.status === 'connected';

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
      <h3 className="text-lg font-semibold mb-4">Estado de Baileys</h3>
      
      <div className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Estado:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Uptime:</span>
          <span className="font-semibold">{data?.uptime.toFixed(1)}%</span>
        </div>

        {/* Number */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Número:</span>
          <span className="font-mono text-sm">{data?.number || 'N/A'}</span>
        </div>

        {/* Last Sync */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Última sincronización:</span>
          <span className="text-sm">
            {data?.lastSync 
              ? new Date(data.lastSync).toLocaleTimeString('es-ES')
              : 'N/A'
            }
          </span>
        </div>

        {/* Reconnect Button */}
        <button
          onClick={handleReconnect}
          disabled={reconnecting}
          className="w-full mt-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          {reconnecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reconectando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Reconectar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

