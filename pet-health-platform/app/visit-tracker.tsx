'use client';

import { useEffect, useRef, useState } from 'react';

import { getHomepageVisitCount, recordHomepageVisit } from '../lib/visit-tracking';

export default function VisitTracker() {
  const visitRequest = useRef<Promise<void> | null>(null);
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    // Share the POST promise across Strict Mode's repeated effect setup.
    // Both setups wait for that same visit before reading the current total.
    if (!visitRequest.current) visitRequest.current = recordHomepageVisit();
    const pendingVisit = visitRequest.current;
    void (async () => {
      await pendingVisit;
      if (!active) return;
      const total = await getHomepageVisitCount();
      if (active) setCount(total);
    })();
    return () => { active = false; };
  }, []);
  return count === null ? null : (
    <p className="muted-message" aria-live="polite">累计首页访问次数：{count}</p>
  );
}
