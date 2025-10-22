// src/app/miniapp-ready.ts
'use client';
import { sdk } from '@farcaster/miniapp-sdk';

export function initMiniApp() {
  // splash kapanır, mini app görünür
  void sdk.actions.ready();
}
