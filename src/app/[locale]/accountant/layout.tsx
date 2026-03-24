import { Suspense } from 'react';
import { AccountantLayout } from '@/components/sections/accountant';

export default function AccountantRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AccountantLayout>{children}</AccountantLayout>
    </Suspense>
  );
}
