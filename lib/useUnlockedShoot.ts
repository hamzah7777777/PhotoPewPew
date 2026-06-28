import { useEffect, useState } from "react";
import type { UnlockedShoot } from "./types";

function cacheKey(slug: string) {
  return `photopewpew:unlocked:${slug}`;
}

export function getCachedUnlock(slug: string): UnlockedShoot | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(cacheKey(slug));
  return raw ? (JSON.parse(raw) as UnlockedShoot) : null;
}

export function setCachedUnlock(slug: string, data: UnlockedShoot) {
  sessionStorage.setItem(cacheKey(slug), JSON.stringify(data));
}

export function useUnlockedShoot(slug: string) {
  const [data, setData] = useState<UnlockedShoot | null>(null);
  const [checkedCache, setCheckedCache] = useState(false);

  useEffect(() => {
    setData(getCachedUnlock(slug));
    setCheckedCache(true);
  }, [slug]);

  function onUnlocked(unlocked: UnlockedShoot) {
    setCachedUnlock(slug, unlocked);
    setData(unlocked);
  }

  return { data, checkedCache, onUnlocked };
}
