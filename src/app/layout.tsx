// app/layout.tsx (özet)
import FarcasterBridge from '@/components/FarcasterBridge';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {/* splash'ın hemen kapanması için: */}
        <FarcasterBridge title="Space Invaders" when="mount" />
        {children}
      </body>
    </html>
  );
}
