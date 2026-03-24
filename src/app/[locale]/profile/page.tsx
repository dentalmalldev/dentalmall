import { Container } from '@mui/material';
import { Header } from "@/components/layout/header/header";
import { ProfileContent } from "@/components/sections";

export default function ProfilePage() {
  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <ProfileContent />
      </Container>
    </>
  );
}
