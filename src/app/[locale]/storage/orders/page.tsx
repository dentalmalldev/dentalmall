'use client';

import { Suspense } from 'react';
import { StorageOrders } from '@/components/sections/storage';

export default function StorageOrdersPage() {
  return (
    <Suspense>
      <StorageOrders />
    </Suspense>
  );
}
