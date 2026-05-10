'use client';

import * as React from 'react';
import type { UserRole } from '@coastal/shared-types';
import { useAuth } from '@/lib/useAuth';

export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user || !role || !roles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
