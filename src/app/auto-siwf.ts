// src/app/auto-siwf.ts
'use client';
import { sdk } from '@farcaster/miniapp-sdk';

export async function autoSIWF() {
  try {
    // nonce’ı sunucunda üretip buraya geçirmen daha güvenli olur
    await sdk.actions.signIn({ nonce: crypto.randomUUID(), acceptAuthAddress: true });
  } catch (e) {
    // kullanıcı reddedebilir; sessiz geç
    console.warn('SIWF atlandı', e);
  }
}
