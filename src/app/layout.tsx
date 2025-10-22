// src/app/layout.tsx
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'FC Invaders',
  description: 'Farcaster mini game on Base',
  manifest: '/manifest.webmanifest',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="h-screen overflow-hidden text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
