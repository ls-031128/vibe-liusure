export async function recordHomepageVisit(): Promise<void> {
  try {
    await fetch('/api/visitors', {
      method: 'POST',
      keepalive: true,
      cache: 'no-store',
    });
  } catch {
    // Best-effort page-view event: never affect the page or show an error.
  }
}

export async function getHomepageVisitCount(): Promise<number | null> {
  try {
    const response = await fetch('/api/visitors', { cache: 'no-store' });
    if (!response.ok) return null;
    const result = await response.json();
    return Number.isSafeInteger(result?.count) && result.count >= 0
      ? result.count : null;
  } catch {
    return null;
  }
}
