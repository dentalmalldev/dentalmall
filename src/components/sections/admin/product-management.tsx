'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { createProductSchema } from '@/lib/validations/product';
import { Category, Vendor, Media, Product } from '@/types/models';
import { auth } from '@/lib/firebase';
import { Add, Close, CloudUpload, Delete } from '@mui/icons-material';

interface VendorOption {
  id: string;
  company_name: string;
  email: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

export function ProductManagement() {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'flat'],
    queryFn: async () => {
      const res = await fetch('/api/categories?flat=true');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Fetch vendors
  const { data: vendors = [] } = useQuery<VendorOption[]>({
    queryKey: ['vendors', 'active'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/vendors?active=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vendors');
      return res.json();
    },
  });

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create product');
      }
      return res.json();
    },
    onSuccess: async (product) => {
      // Link uploaded media to the product
      if (uploadedMedia.length > 0) {
        const token = await auth.currentUser?.getIdToken();
        await Promise.all(
          uploadedMedia.map((media) =>
            fetch('/api/upload', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                media_id: media.id,
                product_id: product.id,
              }),
            })
          )
        );
      }

      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSuccess(t('productCreated'));
      setShowForm(false);
      setUploadedMedia([]);
      formik.resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      name_ka: '',
      description: '',
      description_ka: '',
      manufacturer: '',
      price: 0,
      sale_price: null as number | null,
      discount_percent: null as number | null,
      sku: '',
      stock: 0,
      category_id: '',
      vendor_id: '',
    },
    validationSchema: toFormikValidationSchema(createProductSchema),
    onSubmit: (values) => {
      setError(null);
      setSuccess(null);
      createProductMutation.mutate({
        ...values,
        vendor_id: values.vendor_id || null,
        sale_price: values.sale_price || null,
        discount_percent: values.discount_percent || null,
      });
    },
  });

  // Handle image upload
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      setError(null);

      try {
        const token = await auth.currentUser?.getIdToken();
        const formData = new FormData();

        Array.from(files).forEach((file) => {
          formData.append('files', file);
        });

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to upload images');
        }

        const newMedia = await res.json();
        setUploadedMedia((prev) => [...prev, ...newMedia]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setUploading(false);
      }
    },
    []
  );

  // Handle image removal
  const handleRemoveImage = useCallback(async (mediaId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/upload?id=${mediaId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUploadedMedia((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          {t('products')}
        </Typography>
        <Button
          variant="contained"
          startIcon={showForm ? <Close /> : <Add />}
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              formik.resetForm();
              setUploadedMedia([]);
              setError(null);
              setSuccess(null);
            }
          }}
        >
          {showForm ? t('cancel') : t('createProduct')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {showForm && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
          <Typography variant="h6" fontWeight={600} mb={3}>
            {t('createProduct')}
          </Typography>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Product Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('productName')}
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              {/* Product Name (Georgian) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('productNameKa')}
                  name="name_ka"
                  value={formik.values.name_ka}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name_ka && Boolean(formik.errors.name_ka)}
                  helperText={formik.touched.name_ka && formik.errors.name_ka}
                />
              </Grid>

              {/* Description */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('description')}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              {/* Description (Georgian) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('descriptionKa')}
                  name="description_ka"
                  value={formik.values.description_ka}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              {/* Manufacturer */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('manufacturer')}
                  name="manufacturer"
                  value={formik.values.manufacturer}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>

              {/* SKU */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label={t('sku')}
                  name="sku"
                  value={formik.values.sku}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.sku && Boolean(formik.errors.sku)}
                  helperText={formik.touched.sku && formik.errors.sku}
                />
              </Grid>

              {/* Price */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('price')}
                  name="price"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={formik.touched.price && formik.errors.price}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₾</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Sale Price */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('salePrice')}
                  name="sale_price"
                  value={formik.values.sale_price || ''}
                  onChange={(e) =>
                    formik.setFieldValue(
                      'sale_price',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  onBlur={formik.handleBlur}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₾</InputAdornment>,
                  }}
                />
              </Grid>

              {/* Discount Percent */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('discountPercent')}
                  name="discount_percent"
                  value={formik.values.discount_percent || ''}
                  onChange={(e) =>
                    formik.setFieldValue(
                      'discount_percent',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  onBlur={formik.handleBlur}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>

              {/* Stock */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t('stock')}
                  name="stock"
                  value={formik.values.stock}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.stock && Boolean(formik.errors.stock)}
                  helperText={formik.touched.stock && formik.errors.stock}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              {/* Category */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth error={formik.touched.category_id && Boolean(formik.errors.category_id)}>
                  <InputLabel>{t('category')}</InputLabel>
                  <Select
                    name="category_id"
                    value={formik.values.category_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('category')}
                  >
                    <MenuItem value="" disabled>
                      {t('selectCategory')}
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Vendor */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('vendor')}</InputLabel>
                  <Select
                    name="vendor_id"
                    value={formik.values.vendor_id}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('vendor')}
                  >
                    <MenuItem value="">
                      {t('noVendor')}
                    </MenuItem>
                    {vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.company_name} ({vendor.user.first_name} {vendor.user.last_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Image Upload */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  {t('images')}
                </Typography>

                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: '12px',
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  component="label"
                >
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <CircularProgress size={40} />
                  ) : (
                    <>
                      <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary">
                        {t('dragDropImages')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('maxFileSize')} | {t('allowedFormats')}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Uploaded Images Preview */}
                {uploadedMedia.length > 0 && (
                  <Stack direction="row" spacing={2} mt={2} flexWrap="wrap" useFlexGap>
                    {uploadedMedia.map((media) => (
                      <Box
                        key={media.id}
                        sx={{
                          position: 'relative',
                          width: 100,
                          height: 100,
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component="img"
                          src={media.url}
                          alt={media.original_name}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'rgba(0,0,0,0.7)',
                            },
                          }}
                          onClick={() => handleRemoveImage(media.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowForm(false);
                      formik.resetForm();
                      setUploadedMedia([]);
                    }}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? (
                      <CircularProgress size={24} />
                    ) : (
                      t('save')
                    )}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Products List */}
      <Paper sx={{ p: 3, borderRadius: '12px' }}>
        {productsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : productsData?.data?.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            {t('noProducts')}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {productsData?.data?.map((product: Product) => (
              <Paper
                key={product.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: '8px' }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {product.media && product.media.length > 0 ? (
                    <Box
                      component="img"
                      src={product.media[0].url}
                      alt={product.name}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No image
                      </Typography>
                    </Box>
                  )}
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      SKU: {product.sku} | {t('stock')}: {product.stock}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                      ₾{product.price}
                    </Typography>
                    {product.vendor && (
                      <Typography variant="caption" color="text.secondary">
                        {product.vendor.company_name}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
