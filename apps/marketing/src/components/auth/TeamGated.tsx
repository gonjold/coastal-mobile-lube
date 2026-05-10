'use client';
import { useTeam } from '@/hooks/useTeam';
import type { ReactNode } from 'react';

interface Props {
  /** Show children only when team has at least one active tech member. */
  whenMultiTech?: boolean;
  /** Show children only when team is solo (owner only). */
  whenSolo?: boolean;
  children: ReactNode;
}

export function TeamGated({ whenMultiTech, whenSolo, children }: Props) {
  const { isMultiTech, loading } = useTeam();
  if (loading) return null;
  if (whenMultiTech && !isMultiTech) return null;
  if (whenSolo && isMultiTech) return null;
  return <>{children}</>;
}
