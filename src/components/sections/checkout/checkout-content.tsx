'use client';

import { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCart, useAuth } from '@/providers';
import { AuthGuard } from '@/components/common';
import { AddressStep } from './address-step';
import { PaymentStep } from './payment-step';
import { ReviewStep } from './review-step';
import { ConfirmationStep } from './confirmation-step';
import { Address, CheckoutOrderData } from '@/types/models';

export function CheckoutContent() {
  return (
    <AuthGuard requireDbUser>
      <CheckoutFlow />
    </AuthGuard>
  );
}

function CheckoutFlow() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { items, subtotal, total, clearCart, itemCount } = useCart();
  const { dbUser } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [orderData, setOrderData] = useState<CheckoutOrderData>({
    addressId: '',
    address: null,
    paymentMethod: 'INVOICE',
    notes: '',
  });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    t('steps.address'),
    t('steps.payment'),
    t('steps.review'),
  ];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleAddressSelect = (addressId: string, address: Address) => {
    setOrderData((prev) => ({ ...prev, addressId, address }));
  };

  const handleNotesChange = (notes: string) => {
    setOrderData((prev) => ({ ...prev, notes }));
  };

  const handleSubmitOrder = async () => {
    if (!orderData.addressId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const { auth } = await import('@/lib/firebase');
      const token = await auth.currentUser?.getIdToken();

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: orderData.addressId,
          payment_method: orderData.paymentMethod,
          notes: orderData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const order = await response.json();
      setOrderNumber(order.order_number);
      await clearCart();
      setActiveStep(3);
    } catch (error) {
      console.error('Error creating order:', error);
      alert(t('orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemCount === 0 && activeStep !== 3) {
    return (
      <Box sx={{ padding: { xs: '16px', md: '28px 120px' }, textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {t('emptyCart')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push(`/${locale}/cart`)}
          sx={{ mt: 2 }}
        >
          {t('backToCart')}
        </Button>
      </Box>
    );
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AddressStep
            selectedAddressId={orderData.addressId}
            onSelect={handleAddressSelect}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <PaymentStep
            paymentMethod={orderData.paymentMethod}
            onBack={handleBack}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <ReviewStep
            orderData={orderData}
            items={items}
            subtotal={subtotal}
            total={total}
            notes={orderData.notes}
            onNotesChange={handleNotesChange}
            onBack={handleBack}
            onSubmit={handleSubmitOrder}
            isSubmitting={isSubmitting}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            orderNumber={orderNumber!}
            email={dbUser?.email || ''}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        padding: { xs: '16px', md: '28px 120px' },
        paddingBottom: { xs: '100px', md: '40px' },
        minHeight: '70vh',
      }}
    >
      <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
        {activeStep === 3 ? t('orderComplete') : t('title')}
      </Typography>

      {activeStep < 3 && (
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        {renderStepContent()}
      </Paper>
    </Box>
  );
}
