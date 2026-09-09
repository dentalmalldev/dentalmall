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
import { Close, Tune } from '@mui/icons-material';
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
  /** false → special-order item (kept at vendor); shows a "Special Order" badge */
  inStorageStock?: boolean;
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
  inStorageStock = true,
}: ProductCardProps) {
  const t = useTranslations('productsSection');
  const tDetail = useTranslations('productDetail');
  const locale = useLocale();

  const { user } = useAuth();
  const { addToCart, queueAddToCart } = useCart();
  const { showSnackbar } = useSnackbar();
  const { openAuthModal } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(null);

  const productUrl = `/${locale}/products/${id}`;

  const hasVariants = !!variantTypes?.some((vt) => (vt.options?.length ?? 0) > 0);
  // Badge counter: how many choices the customer actually gets across all dimensions.
  const variantOptionCount =
    variantTypes?.reduce((sum, vt) => sum + (vt.options?.length ?? 0), 0) ?? 0;
  const firstVariantType = variantTypes?.find((vt) => (vt.options?.length ?? 0) > 0);
  const firstVariantTypeLabel = firstVariantType
    ? (locale === 'ka' ? firstVariantType.name_ka : firstVariantType.name)
    : '';
  const getOptionLabel = (o: VariantOption) => (locale === 'ka' ? o.name_ka : o.name);
  const getTypeLabel = (vt: VariantType) => (locale === 'ka' ? vt.name_ka : vt.name);

  const handleClickAddToCart = async () => {
    // For variant products, let the customer pick a variant first — even when
    // logged out — so the queued intent carries the correct selection.
    if (hasVariants) {
      setSelectedVariant(null);
      setVariantModalOpen(true);
      return;
    }
    await performAddToCart(undefined);
  };

  const performAddToCart = async (variantOptionId: string | undefined) => {
    // Logged out: park the intent and prompt sign-in. The item is added
    // automatically once the user authenticates.
    if (!user) {
      queueAddToCart(id, 1, variantOptionId);
      setVariantModalOpen(false);
      openAuthModal();
      return;
    }

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
            height: { xs: '170px', sm: '190px', md: '210px' },
            backgroundColor: '#F5F6FF',
            borderRadius: '12px',
            cursor: 'pointer',
          }}
        >
          <Image
            src={image || '/logos/placeholder.jpg'}
            alt={name}
            fill
            // Without `sizes` a filled image is treated as full-viewport wide,
            // so the browser picks a variant that doesn't match the card.
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 300px"
            quality={90}
            style={{ objectFit: 'cover' }}
          />
          {discount && (
            <Chip
              label={`-${discount}%`}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#5B6ECD',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            />
          )}
          {!inStorageStock && (
            <Chip
              label={t('specialOrder')}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                backgroundColor: '#F59E0B',
                color: 'white',
                fontWeight: 600,
                fontSize: '12px',
              }}
            />
          )}
          {/* Tells the customer up front that this product comes in several choices. */}
          {hasVariants && (
            <Chip
              icon={<Tune sx={{ fontSize: 16 }} />}
              label={t('variantOptions', { count: variantOptionCount })}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                backgroundColor: 'rgba(255,255,255,0.92)',
                color: '#3E4388',
                fontWeight: 600,
                fontSize: '12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                '& .MuiChip-icon': { color: '#5B6ECD', ml: '6px' },
              }}
            />
          )}
        </Box>
      </Link>

      {/* Product Info */}
      <Box sx={{ padding: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Link href={productUrl} style={{ textDecoration: 'none' }}>
          {/* Clamped to two lines and always occupying two lines' worth of space,
              so a one-word name and a long one produce identically sized cards. */}
          <Typography
            variant="h6"
            title={name}
            sx={{
              fontSize: '14px',
              fontWeight: 600,
              lineHeight: 1.35,
              color: '#3E4388',
              marginBottom: 0.5,
              cursor: 'pointer',
              overflowWrap: 'anywhere',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.7em',
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
            fontSize: '11px',
            color: '#3E438899',
            marginBottom: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('manufacturer')}: {manufacturer}
        </Typography>

        {/* Price */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ marginTop: 'auto', marginBottom: 1.5 }}>
          <Typography
            variant="h5"
            sx={{
              fontSize: '18px',
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
                fontSize: '13px',
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
              <CircularProgress size={18} color="inherit" />
            ) : (
              <svg
                width="18"
                height="18"
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
            padding: '7px 12px',
            fontSize: '13px',
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
