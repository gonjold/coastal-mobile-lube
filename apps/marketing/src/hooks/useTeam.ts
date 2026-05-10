'use client';
import { useAuth } from './useAuth';

export function useTeam() {
  const { team, isMultiTech, loading } = useAuth();
  return { team, isMultiTech, loading };
}
