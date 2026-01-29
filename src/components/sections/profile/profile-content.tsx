'use client';

import { Container, Typography, Box } from '@mui/material';
import { AuthGuard } from '@/components/common';
import { useAuth } from '@/providers';

export function ProfileContent() {
  return (
    <AuthGuard requireDbUser={true}>
      <ProfileDetails />
    </AuthGuard>
  );
}

function ProfileDetails() {
  const { dbUser } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Profile
      </Typography>

      <Box sx={{ mt: 3 }}>
        {/* Add your profile UI here */}
        <Typography>
          Welcome, {dbUser?.first_name} {dbUser?.last_name}
        </Typography>
        <Typography color="text.secondary">
          {dbUser?.email}
        </Typography>
      </Box>
    </Container>
  );
}
