'use client';

import {
  getSiteCopy,
  resolveCopyTier,
  simplifyTerms,
  type CopyTier,
  type SiteCopy,
} from '@/lib/copy/entrepreneur-level';
import { QUIZ_PROFILE_KEY } from '@/lib/quiz/profile-storage';
import { loadQuizProfile } from '@/lib/quiz/profile-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type EntrepreneurCopyContextValue = {
  tier: CopyTier;
  copy: SiteCopy;
  refresh: () => void;
  simplify: (text: string) => string;
};

const EntrepreneurCopyContext = createContext<EntrepreneurCopyContextValue | null>(null);

export default function EntrepreneurCopyProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<CopyTier>(() =>
    resolveCopyTier(loadQuizProfile()?.entrepreneurialLevel)
  );

  const refresh = useCallback(() => {
    setTier(resolveCopyTier(loadQuizProfile()?.entrepreneurialLevel));
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === QUIZ_PROFILE_KEY || e.key?.startsWith('buildrai_')) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    window.addEventListener('buildrai:quiz-profile', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('buildrai:quiz-profile', refresh);
    };
  }, [refresh]);

  const copy = useMemo(() => getSiteCopy(tier), [tier]);
  const simplify = useCallback((text: string) => simplifyTerms(text, tier), [tier]);

  const value = useMemo(
    () => ({ tier, copy, refresh, simplify }),
    [tier, copy, refresh, simplify]
  );

  return (
    <EntrepreneurCopyContext.Provider value={value}>{children}</EntrepreneurCopyContext.Provider>
  );
}

export function useEntrepreneurCopy(): EntrepreneurCopyContextValue {
  const ctx = useContext(EntrepreneurCopyContext);
  if (!ctx) {
    const tier = resolveCopyTier(null);
    const copy = getSiteCopy(tier);
    return {
      tier,
      copy,
      refresh: () => {},
      simplify: (text) => simplifyTerms(text, tier),
    };
  }
  return ctx;
}
