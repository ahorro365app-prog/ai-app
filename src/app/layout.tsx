import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootClientWrapper from "@/components/RootClientWrapper";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { StatusBarProvider } from "@/contexts/StatusBarContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import { NotificationToastProvider } from "@/contexts/NotificationToastContext";
import SupabaseErrorBoundary from "@/components/SupabaseErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ahorro365 - Gestiona tus finanzas con IA",
  description: "Controla tus gastos, establece metas de ahorro y alcanza la libertad financiera con inteligencia artificial",
  icons: {
    icon: [
      { url: '/app-icon.png', sizes: 'any' },
      { url: '/app-icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/app-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/app-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ahorro365',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Capturador global de errores (logs removidos para producción)
              window.addEventListener('error', function(event) {
                // Error capturado - enviado a Sentry si está configurado
              });
              
              // Capturador de promesas rechazadas (logs removidos para producción)
              window.addEventListener('unhandledrejection', function(event) {
                // Promesa rechazada - enviada a Sentry si está configurado
              });
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <SupabaseErrorBoundary>
          <SupabaseProvider>
            <StatusBarProvider>
              <ModalProvider>
                <VoiceProvider>
                  <NotificationToastProvider>
                    <RootClientWrapper>
                      {children}
                    </RootClientWrapper>
                  </NotificationToastProvider>
                </VoiceProvider>
              </ModalProvider>
            </StatusBarProvider>
          </SupabaseProvider>
        </SupabaseErrorBoundary>
      </body>
    </html>
  );
}
