import { Suspense } from 'react';
import { OrdersManagement } from '@/components/sections/accountant';

export default function AccountantOrdersPage() {
  return (
    <Suspense>
      <OrdersManagement />
    </Suspense>
  );
}
