// src/components/FarcasterBridge.tsx
'use client';
import { useEffect } from 'react';

declare global {
  interface Window {
    farcaster?: {
      actions?: {
        ready: () => void;
        setTitle?: (title: string) => void;
      };
    };
  }
}

/** Farcaster webview splash'ını kapatır. */
export default function FarcasterBridge({
  title,
  when = 'mount',
}: {
  /** İsteğe bağlı başlık */
  title?: string;
  /** 'mount' = hemen; 'images' = window load sonrası */
  when?: 'mount' | 'images';
}) {
  useEffect(() => {
    const fire = () => {
      try {
        if (title) window.farcaster?.actions?.setTitle?.(title);
        window.farcaster?.actions?.ready?.();
      } catch {
        /* yoksay */
      }
    };

    if (when === 'images') {
      if (document.readyState === 'complete') fire();
      else window.addEventListener('load', fire, { once: true });
      return () => window.removeEventListener('load', fire);
    } else {
      // mount
      const t = setTimeout(fire, 0);
      return () => clearTimeout(t);
    }
  }, [title, when]);

  return null;
}
