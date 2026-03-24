import { Container } from '@mui/material';
import { Header } from '@/components/layout/header/header';
import { FAQContent } from '@/components/sections/faq/faq-content';

export default function FAQPage() {
  return (
    <>
      <Header />
      <Container maxWidth="lg">
        <FAQContent />
      </Container>
    </>
  );
}
