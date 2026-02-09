'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Pagination,
  Skeleton,
} from '@mui/material';
import { Search, Edit } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers';
import { vendorService } from '@/services';
import { Product } from '@/types/models';
import { VendorProductPricingDialog } from './vendor-product-pricing-dialog';

interface VendorProductsProps {
  vendorId?: string;
}

export function VendorProducts({ vendorId }: VendorProductsProps) {
  const t = useTranslations('vendorDashboard');
  const locale = useLocale();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['vendor', 'products', page, debouncedSearch, vendorId],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return vendorService.getProducts(user, {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        vendor_id: vendorId,
      });
    },
    enabled: !!user,
  });

  const products = productsData?.data || [];
  const totalPages = productsData?.total_pages || 1;

  const getName = (product: Product) =>
    locale === 'ka' ? product.name_ka : product.name;

  const getCategoryName = (product: Product) =>
    locale === 'ka' ? product.category?.name_ka : product.category?.name;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" fontWeight={700}>
          {t('products')}
        </Typography>
        <TextField
          size="small"
          placeholder={t('searchProducts')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': { borderRadius: '10px' },
          }}
        />
      </Stack>

      {isLoading ? (
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: '12px' }} />
          ))}
        </Stack>
      ) : products.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">{t('noProducts')}</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products')}</TableCell>
                  <TableCell>{t('sku')}</TableCell>
                  <TableCell>{t('price')}</TableCell>
                  <TableCell>{t('salePrice')}</TableCell>
                  <TableCell>{t('discountPercent')}</TableCell>
                  <TableCell>{t('stock')}</TableCell>
                  <TableCell>{t('variants')}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => {
                  const price = parseFloat(product.price);
                  const salePrice = product.sale_price
                    ? parseFloat(product.sale_price)
                    : null;
                  const imageUrl = product.media?.[0]?.url;

                  return (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar
                            src={imageUrl}
                            variant="rounded"
                            sx={{ width: 40, height: 40, bgcolor: '#f0f0f0' }}
                          >
                            {getName(product)?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {getName(product)}
                            </Typography>
                            {product.category && (
                              <Typography variant="caption" color="text.secondary">
                                {getCategoryName(product)}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {product.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          ₾{price.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {salePrice ? (
                          <Typography variant="body2" color="error.main" fontWeight={600}>
                            ₾{salePrice.toFixed(2)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.discount_percent ? (
                          <Chip
                            label={`-${product.discount_percent}%`}
                            size="small"
                            sx={{ bgcolor: '#FF6B6B', color: 'white', fontWeight: 600 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.stock}
                          size="small"
                          color={product.stock > 0 ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {product.variants?.length || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => setEditingProduct(product)}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500,
                          }}
                        >
                          {t('editPricing')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Pricing Dialog */}
      {editingProduct && (
        <VendorProductPricingDialog
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </Box>
  );
}
