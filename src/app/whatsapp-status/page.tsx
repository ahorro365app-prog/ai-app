'use client';

import StatusCard from '@/components/WhatsApp/StatusCard';
import MetricsCard from '@/components/WhatsApp/MetricsCard';
import EventsLog from '@/components/WhatsApp/EventsLog';

export default function WhatsAppStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Status</h1>
            <p className="text-gray-500 mt-1">Monitoreo en tiempo real de Baileys Worker</p>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Auto-refresh: 15-30s
          </span>
        </div>

        {/* Status Card */}
        <StatusCard />

        {/* Metrics Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Métricas de Hoy</h2>
          <MetricsCard />
        </div>

        {/* Events Log */}
        <EventsLog />
      </div>
    </div>
  );
}

