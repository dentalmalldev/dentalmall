'use client';

import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

import { useCart, useAuth, useSnackbar, useAuthModal } from '@/providers';
import { useState } from 'react';
import type { VariantType, VariantOption } from '@/types/models';

export interface ProductCardProps {
  id: string;
  name: string;
  manufacturer: string;
  image: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  /** Show "From X₾" / "X₾-დან" prefix — used when the product has variants */
  fromLabel?: boolean;
  /** Variant types for in-card selection modal. When present, clicking add-to-cart opens a picker instead of adding directly. */
  variantTypes?: VariantType[];
}

export function ProductCard({
  id,
  name,
  manufacturer,
  image,
  price,
  originalPrice,
  discount,
  fromLabel,
  variantTypes,
}: ProductCardProps) {
  const t = useTranslations('productsSection');
  const tDetail = useTranslations('productDetail');
  const locale = useLocale();

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { showSnackbar } = useSnackbar();
  const { openAuthModal } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);

  const productUrl = `/${locale}/products/${id}`;

  const hasVariants = !!variantTypes?.some((vt) => (vt.options?.length ?? 0) > 0);
  const firstVariantType = variantTypes?.find((vt) => (vt.options?.length ?? 0) > 0);
  const firstVariantTypeLabel = firstVariantType
    ? (locale === 'ka' ? firstVariantType.name_ka : firstVariantType.name)
    : '';
  const getOptionLabel = (o: VariantOption) => (locale === 'ka' ? o.name_ka : o.name);
  const getTypeLabel = (vt: VariantType) => (locale === 'ka' ? vt.name_ka : vt.name);

  const handleClickAddToCart = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (hasVariants) {
      setSelectedVariant(null);
      setVariantModalOpen(true);
      return;
    }
    await performAddToCart(undefined);
  };

  const performAddToCart = async (variantOptionId: string | undefined) => {
    setLoading(true);
    try {
      await addToCart(id, 1, variantOptionId);
      showSnackbar(t('addedToCart'));
      setVariantModalOpen(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showSnackbar(t('addToCartError'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVariant = async () => {
    if (!selectedVariant) return;
    await performAddToCart(selectedVariant.id);
  };

  return (
    <Box
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* Product Image */}
      <Link href={productUrl} style={{ textDecoration: 'none' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '250px',
            backgroundColor: '#F5F6FF',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          <Image
            src={image || '/logos/placeholder.jpg'}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
          />
          {discount && (
            <Chip
              label={`-${discount}%`}
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: '#5B6ECD',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            />
          )}
        </Box>
      </Link>

      {/* Product Info */}
      <Box sx={{ padding: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href={productUrl} style={{ textDecoration: 'none' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#3E4388',
              marginBottom: 0.5,
              cursor: 'pointer',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '2.8em',
              '&:hover': {
                color: '#5B6ECD',
              },
            }}
          >
            {name}
          </Typography>
        </Link>

        <Typography
          variant="body2"
          sx={{
            fontSize: '12px',
            color: '#3E438899',
            marginBottom: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('manufacturer')}: {manufacturer}
        </Typography>

        {/* Price */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ marginTop: 'auto', marginBottom: 2 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#3E4388',
            }}
          >
            {fromLabel ? t('priceFrom', { price }) : `${price}₾`}
          </Typography>
          {originalPrice && (
            <Typography
              variant="body2"
              sx={{
                fontSize: '14px',
                color: '#3E438866',
                textDecoration: 'line-through',
              }}
            >
              {fromLabel ? t('priceFrom', { price: originalPrice }) : `${originalPrice}₾`}
            </Typography>
          )}
        </Stack>

        {/* Add to Cart Button */}
        <Button
          variant="contained"
          fullWidth
          onClick={handleClickAddToCart}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38754 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6M10 21C10 21.5523 9.55228 22 9 22C8.44772 22 8 21.5523 8 21C8 20.4477 8.44772 20 9 20C9.55228 20 10 20.4477 10 21ZM21 21C21 21.5523 20.5523 22 20 22C19.4477 22 19 21.5523 19 21C19 20.4477 19.4477 20 20 20C20.5523 20 21 20.4477 21 21Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          }
          sx={{
            borderRadius: '100px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#5B6ECD',
            '&:hover': {
              backgroundColor: '#4A5BC0',
            },
          }}
        >
          {t('addToCart')}
        </Button>
      </Box>

      {/* Variant Picker Modal */}
      <Dialog
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ pr: 5, fontWeight: 700, color: '#2C2957' }}>
          {name}
          <IconButton
            aria-label="close"
            onClick={() => setVariantModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#6B7280' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {variantTypes?.filter((vt) => (vt.options?.length ?? 0) > 0).map((variantType) => (
            <Box key={variantType.id} sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#2C2957' }}>
                {getTypeLabel(variantType)}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(variantType.options ?? []).map((option) => (
                  <Chip
                    key={option.id}
                    label={getOptionLabel(option)}
                    onClick={() => setSelectedVariant(option)}
                    variant={selectedVariant?.id === option.id ? 'filled' : 'outlined'}
                    color={selectedVariant?.id === option.id ? 'primary' : 'default'}
                    sx={{
                      fontWeight: selectedVariant?.id === option.id ? 600 : 400,
                      borderRadius: '8px',
                      px: 1,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ))}

          {selectedVariant && (() => {
            const original = parseFloat(selectedVariant.dentalmall_price);
            const sale = selectedVariant.sale_price ? parseFloat(selectedVariant.sale_price) : null;
            const final = sale ?? original;
            return (
              <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 2, pt: 2, borderTop: '1px solid #E5E7EB' }}>
                <Typography
                  variant="h5"
                  sx={{ fontSize: '22px', fontWeight: 700, color: '#3E4388' }}
                >
                  ₾{final.toFixed(2)}
                </Typography>
                {sale && (
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '14px', color: '#3E438866', textDecoration: 'line-through' }}
                  >
                    ₾{original.toFixed(2)}
                  </Typography>
                )}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setVariantModalOpen(false)}
            sx={{ textTransform: 'none', color: '#6B7280' }}
          >
            {tDetail('goBack')}
          </Button>
          <Button
            variant="contained"
            disabled={!selectedVariant || loading}
            onClick={handleConfirmVariant}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#5B6ECD',
              '&:hover': { backgroundColor: '#4A5BC0' },
            }}
          >
            {selectedVariant
              ? t('addToCart')
              : firstVariantTypeLabel
                ? tDetail('selectVariantPrompt', { name: firstVariantTypeLabel })
                : tDetail('selectVariantGeneric')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
