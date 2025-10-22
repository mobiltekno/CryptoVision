'use client';
import { initMiniApp } from './miniapp-ready';
initMiniApp();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="tr"><body>{children}</body></html>;
}
