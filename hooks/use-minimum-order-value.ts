'use client';

import { useEffect, useState } from 'react';

const DEFAULT_MINIMUM_ORDER_VALUE = 500;
let cachedValue = DEFAULT_MINIMUM_ORDER_VALUE;
let cachedAt = 0;
let settingsRequest: Promise<number> | null = null;
const CACHE_MS = 60_000;

async function loadMinimumOrderValue(): Promise<number> {
  if (settingsRequest) return settingsRequest;
  settingsRequest = fetch('/api/settings')
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      const value = Number(data?.settings?.MIN_ORDER_VALUE ?? DEFAULT_MINIMUM_ORDER_VALUE);
      cachedValue = Number.isFinite(value) && value >= 0 ? value : DEFAULT_MINIMUM_ORDER_VALUE;
      cachedAt = Date.now();
      return cachedValue;
    })
    .catch(() => DEFAULT_MINIMUM_ORDER_VALUE)
    .finally(() => { settingsRequest = null; });
  return settingsRequest;
}

export function useMinimumOrderValue() {
  const [minimumOrderValue, setMinimumOrderValue] = useState(cachedValue);
  const [isMinimumOrderValueReady, setIsMinimumOrderValueReady] = useState(cachedAt > 0);

  useEffect(() => {
    let active = true;
    if (cachedAt > 0 && Date.now() - cachedAt < CACHE_MS) {
      setMinimumOrderValue(cachedValue);
      setIsMinimumOrderValueReady(true);
      return;
    }

    loadMinimumOrderValue().then((value) => {
      if (!active) return;
      setMinimumOrderValue(value);
      setIsMinimumOrderValueReady(true);
    });

    return () => { active = false; };
  }, []);

  return { minimumOrderValue, isMinimumOrderValueReady };
}
