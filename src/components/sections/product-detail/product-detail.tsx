'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Skeleton,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add,
  Remove,
  ShoppingCart,
  ArrowBack,
  Store,
} from '@mui/icons-material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useProduct } from '@/hooks';
import { useCart } from '@/providers';
import { colors } from '@/theme';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface ProductDetailProps {
  productId: string;
}

export function ProductDetail({ productId }: ProductDetailProps) {
  const { data: product, isLoading, error } = useProduct(productId);
  const { addToCart } = useCart();
  const t = useTranslations('productDetail');
  const locale = useLocale();
  const router = useRouter();
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [quantity, setQuantity] = useState(1);

  const getName = () => (locale === 'ka' ? product?.name_ka : product?.name);
  const getDescription = () =>
    locale === 'ka' ? product?.description_ka : product?.description;
  const getCategoryName = () =>
    locale === 'ka' ? product?.category?.name_ka : product?.category?.name;

  const price = product ? parseFloat(product.price) : 0;
  const salePrice = product?.sale_price ? parseFloat(product.sale_price) : null;
  const finalPrice = salePrice || price;
  const discount = product?.discount_percent || (salePrice ? Math.round((1 - salePrice / price) * 100) : null);

  const images = product?.media?.map((m) => m.url) || [];
  const hasImages = images.length > 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, product?.stock || 99)));
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ padding: { xs: '16px', md: '28px 120px' } }}>
        <Skeleton variant="text" width={100} height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
          <Skeleton variant="rounded" sx={{ width: { xs: '100%', md: 500 }, height: 400 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="80%" height={48} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" width={200} height={48} sx={{ mt: 4 }} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ padding: { xs: '16px', md: '28px 120px' }, textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {t('notFound')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          {t('goBack')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: { xs: '16px', md: '28px 120px' },
        paddingBottom: { xs: '100px', md: '40px' },
      }}
    >
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.back()}
        sx={{ mb: 3, color: 'text.secondary' }}
      >
        {t('goBack')}
      </Button>

      <Box
        sx={{
          display: 'flex',
          gap: { xs: 3, md: 6 },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Image Gallery */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, maxWidth: 600 }}>
          {/* Main Swiper */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              bgcolor: '#f8f9fa',
              mb: 2,
            }}
          >
            {hasImages ? (
              <Swiper
                modules={[Navigation, Thumbs, FreeMode]}
                navigation
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                spaceBetween={0}
                slidesPerView={1}
                style={{
                  '--swiper-navigation-color': colors.primary[70],
                  '--swiper-navigation-size': '32px',
                } as React.CSSProperties}
              >
                {images.map((image, index) => (
                  <SwiperSlide key={index}>
                    <Box
                      sx={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 2,
                      }}
                    >
                      <Box
                        component="img"
                        src={image}
                        alt={`${getName()} - ${index + 1}`}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <Box
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f0f0f0',
                }}
              >
                <Typography color="text.secondary">{t('noImage')}</Typography>
              </Box>
            )}
          </Paper>

          {/* Thumbnails Swiper */}
          {hasImages && images.length > 1 && (
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[FreeMode, Thumbs]}
              spaceBetween={12}
              slidesPerView={4}
              freeMode
              watchSlidesProgress
              style={{ cursor: 'pointer' }}
            >
              {images.map((image, index) => (
                <SwiperSlide key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      bgcolor: '#f8f9fa',
                      border: '2px solid transparent',
                      transition: 'border-color 0.2s',
                      '&:hover': {
                        borderColor: colors.primary[70],
                      },
                      '.swiper-slide-thumb-active &': {
                        borderColor: colors.primary[70],
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={image}
                      alt={`${getName()} thumbnail ${index + 1}`}
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                      }}
                    />
                  </Paper>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </Box>

        {/* Product Info */}
        <Box sx={{ flex: 1 }}>
          {/* Category */}
          {product.category && (
            <Chip
              label={getCategoryName()}
              size="small"
              sx={{
                mb: 2,
                bgcolor: colors.primary[10],
                color: colors.primary[70],
                fontWeight: 500,
              }}
            />
          )}

          {/* Name */}
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            gutterBottom
          >
            {getName()}
          </Typography>

          {/* SKU */}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            SKU: {product.sku}
          </Typography>

          {/* Vendor */}
          {product.vendor && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, mb: 2 }}>
              <Store fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {product.vendor.company_name}
                {product.vendor.city && ` • ${product.vendor.city}`}
              </Typography>
            </Stack>
          )}

          {/* Manufacturer */}
          {product.manufacturer && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('manufacturer')}: {product.manufacturer}
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Price */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="primary.main"
              >
                ₾{finalPrice.toFixed(2)}
              </Typography>
              {salePrice && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through' }}
                >
                  ₾{price.toFixed(2)}
                </Typography>
              )}
              {discount && (
                <Chip
                  label={`-${discount}%`}
                  size="small"
                  sx={{
                    bgcolor: '#FF6B6B',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Stock Status */}
          <Typography
            variant="body2"
            sx={{
              mb: 3,
              color: product.stock > 0 ? 'success.main' : 'error.main',
              fontWeight: 500,
            }}
          >
            {product.stock > 0
              ? `${t('inStock')} (${product.stock})`
              : t('outOfStock')}
          </Typography>

          {/* Quantity & Add to Cart */}
          {product.stock > 0 && (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
              {/* Quantity Selector */}
              <Paper
                variant="outlined"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <IconButton
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  sx={{ borderRadius: 0 }}
                >
                  <Remove />
                </IconButton>
                <Typography
                  sx={{
                    px: 3,
                    py: 1,
                    minWidth: 50,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {quantity}
                </Typography>
                <IconButton
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  sx={{ borderRadius: 0 }}
                >
                  <Add />
                </IconButton>
              </Paper>

              {/* Add to Cart Button */}
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleAddToCart}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                {t('addToCart')}
              </Button>
            </Stack>
          )}

          {/* Description */}
          {getDescription() && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t('description')}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {getDescription()}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
