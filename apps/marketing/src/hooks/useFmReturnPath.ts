'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const ELIGIBLE_LIST_PATHS = ['/tech', '/tech/schedule', '/tech/unassigned'] as const;

export type FmReturnPathInfo = {
  href: string;
  label: string;
};

export function useFmReturnPathWriter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;

    if (!ELIGIBLE_LIST_PATHS.includes(pathname as (typeof ELIGIBLE_LIST_PATHS)[number])) {
      return;
    }

    const qs = searchParams.toString();
    const fullUrl = qs ? `${pathname}?${qs}` : pathname;
    sessionStorage.setItem('fmReturnPath', fullUrl);
  }, [pathname, searchParams]);
}

export function useFmReturnPath(role: string | null): FmReturnPathInfo {
  const [info, setInfo] = useState<FmReturnPathInfo>(() => ({
    href: '/tech/jobs',
    label: '← Back to jobs',
  }));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = sessionStorage.getItem('fmReturnPath');

    if (stored) {
      const pathOnly = stored.split('?')[0];
      let label = '← Back';
      if (pathOnly === '/tech') label = '← Back to dashboard';
      else if (pathOnly === '/tech/schedule') label = '← Back to schedule';
      else if (pathOnly === '/tech/unassigned') label = '← Back to unassigned';
      else if (pathOnly === '/tech/jobs') label = '← Back to jobs';
      setInfo({ href: stored, label });
      return;
    }

    if (role === 'admin') {
      setInfo({ href: '/tech', label: '← Back to dashboard' });
    } else {
      setInfo({ href: '/tech/jobs', label: '← Back to jobs' });
    }
  }, [role]);

  return info;
}
