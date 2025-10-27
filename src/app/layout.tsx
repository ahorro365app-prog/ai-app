import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RootClientWrapper from "@/components/RootClientWrapper";
import { SupabaseProvider } from "@/contexts/SupabaseContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { StatusBarProvider } from "@/contexts/StatusBarContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <SupabaseErrorBoundary>
          <SupabaseProvider>
            <StatusBarProvider>
              <ModalProvider>
                <VoiceProvider>
                  <RootClientWrapper>
                    {children}
                  </RootClientWrapper>
                </VoiceProvider>
              </ModalProvider>
            </StatusBarProvider>
          </SupabaseProvider>
        </SupabaseErrorBoundary>
      </body>
    </html>
  );
}
