import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Container } from '@mui/material';
import { ProfileContent } from "@/components/sections";

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: true },
};

export default function ProfilePage() {
  return (
    <Container maxWidth="lg">
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </Container>
  );
}
