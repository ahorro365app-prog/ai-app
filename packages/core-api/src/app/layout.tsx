import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ahorro365',
  description: 'Gestión de finanzas personales',
  // Layout para páginas legales (privacy, terms, delete-data)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

