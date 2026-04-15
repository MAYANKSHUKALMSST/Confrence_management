// Failover configuration and logic for automatic server switching
import { useState, useEffect, useCallback, useRef } from 'react';

/** 
 * With the Virtual IP (VIP) setup, users only see 10.30.71.50.
 * The network handles the switch behind the scenes.
 * We no longer need client-side redirects.
 */
export const VIRTUAL_IP = '10.30.71.50';

const HEALTH_CHECK_INTERVAL = 10_000;  // 10 seconds
const HEALTH_CHECK_TIMEOUT = 3_000;    // 3 second timeout 

// ── Utility Functions ──────────────────────────────────────────────────────

/** Check if the current environment is using the VIP or local dev */
export function isUsingVip(): boolean {
  return window.location.hostname === '10.30.71.50';
}

/** Check if the VIP is currently healthy */
export async function checkVipHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const res = await fetch('/api/health', {
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-cache',
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

// ── Failover State Monitoring ──────────────────────────────────────────────

let consecutiveNetworkErrors = 0;
const FAILURE_THRESHOLD = 2; // Low threshold on VIP

export function reportNetworkError(): void {
  consecutiveNetworkErrors++;
  // We don't redirect anymore, just let the UI know things are shaky
}

export function reportNetworkSuccess(): void {
  consecutiveNetworkErrors = 0;
}

// ── React Hook ─────────────────────────────────────────────────────────────

export interface FailoverState {
  /** Whether the VIP is currently responding */
  isHealthy: boolean;
  /** Whether we're in a failover/recovery state */
  isFailoverActive: boolean;
  /** The reported role of the current active server */
  activeRole: 'primary' | 'backup' | 'unknown';
}

export function useFailover(): FailoverState {
  const [isHealthy, setIsHealthy] = useState(true);
  const [activeRole, setActiveRole] = useState<'primary' | 'backup' | 'unknown'>('unknown');

  useEffect(() => {
    // Initial check
    const runCheck = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          setActiveRole(data.role || 'unknown');
          setIsHealthy(true);
        } else {
          setIsHealthy(false);
        }
      } catch {
        setIsHealthy(false);
      }
    };

    runCheck();
    const interval = setInterval(runCheck, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return {
    isHealthy,
    isFailoverActive: activeRole === 'backup',
    activeRole,
  };
}
