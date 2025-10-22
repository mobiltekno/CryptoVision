// src/app/miniapp-ready.ts
'use client';
import { sdk } from '@farcaster/miniapp-sdk';
import { autoSIWF } from './auto-siwf';

export function initMiniApp() {
  void sdk.actions.ready().then(() => autoSIWF());
}
