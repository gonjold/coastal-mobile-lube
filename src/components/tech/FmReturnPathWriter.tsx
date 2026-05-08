'use client';

import { Suspense } from 'react';
import { useFmReturnPathWriter } from '@/hooks/useFmReturnPath';

function Writer() {
  useFmReturnPathWriter();
  return null;
}

export default function FmReturnPathWriter() {
  return (
    <Suspense fallback={null}>
      <Writer />
    </Suspense>
  );
}
