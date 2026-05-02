import type { Metadata } from 'next';
import { Container } from '@mui/material';
import { ProfileContent } from "@/components/sections";

export const metadata: Metadata = {
  title: 'Profile',
  robots: { index: false, follow: true },
};

export default function ProfilePage() {
  return (
    <Container maxWidth="lg">
      <ProfileContent />
    </Container>
  );
}
