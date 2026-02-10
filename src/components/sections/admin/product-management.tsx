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
import { createProductYupSchema } from '@/lib/validations/product';
import { Category, Media, Product } from '@/types/models';
import { auth } from '@/lib/firebase';
import { Add, Close, CloudUpload, Delete, Edit, AddCircleOutline } from '@mui/icons-material';
import { Divider } from '@mui/material';

interface VendorOption {
  id: string;
  company_name: string;
  email: string;
  user: {
    first_name: string;
    last_name: string;
  };
}

interface VariantOptionFormValues {
  id?: string;
  name: string;
  name_ka: string;
  price: number;
  sale_price: number | null;
  discount_percent: number | null;
  stock: number;
}

interface VariantTypeFormValues {
  id?: string;
  name: string;
  name_ka: string;
  options: VariantOptionFormValues[];
}

export function ProductManagement() {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const isEditMode = editingProduct !== null;

  // Fetch hierarchical categories (parents with children)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'hierarchical'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  // Get subcategories for selected parent
  const subcategories = categories.find((c) => c.id === selectedParentCategoryId)?.children || [];

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

  const resetForm = () => {
    formik.resetForm();
    setUploadedMedia([]);
    setSelectedParentCategoryId('');
    setEditingProduct(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

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
          uploadedMedia
            .filter((m) => !m.product_id)
            .map((media) =>
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
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update product');
      }
      return res.json();
    },
    onSuccess: async (product) => {
      // Link any newly uploaded media
      const newMedia = uploadedMedia.filter((m) => !m.product_id);
      if (newMedia.length > 0) {
        const token = await auth.currentUser?.getIdToken();
        await Promise.all(
          newMedia.map((media) =>
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
      setSuccess(t('productUpdated'));
      resetForm();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setSuccess(t('productDeleted'));
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
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
      variant_types: [] as VariantTypeFormValues[],
    },
    validationSchema: createProductYupSchema,
    onSubmit: (values) => {
      setError(null);
      setSuccess(null);

      const payload = {
        ...values,
        vendor_id: values.vendor_id || null,
        sale_price: values.sale_price || null,
        discount_percent: values.discount_percent || null,
        variant_types: values.variant_types.length > 0 ? values.variant_types : undefined,
      };

      if (isEditMode) {
        updateProductMutation.mutate({ id: editingProduct.id, data: payload });
      } else {
        createProductMutation.mutate(payload);
      }
    },
  });

  const handleEdit = (product: Product) => {
    setError(null);
    setSuccess(null);
    setEditingProduct(product);
    setShowForm(true);

    // Find parent category for the product's category
    let parentId = '';
    for (const cat of categories) {
      if (cat.id === product.category_id) {
        parentId = cat.id;
        break;
      }
      if (cat.children) {
        const child = cat.children.find((c) => c.id === product.category_id);
        if (child) {
          parentId = cat.id;
          break;
        }
      }
    }
    setSelectedParentCategoryId(parentId);

    // Set form values
    formik.setValues({
      name: product.name,
      name_ka: product.name_ka,
      description: product.description || '',
      description_ka: product.description_ka || '',
      manufacturer: product.manufacturer || '',
      price: parseFloat(String(product.price)),
      sale_price: product.sale_price ? parseFloat(String(product.sale_price)) : null,
      discount_percent: product.discount_percent ?? null,
      sku: product.sku || '',
      stock: product.stock,
      category_id: product.category_id || '',
      vendor_id: product.vendor_id || '',
      variant_types: (product.variant_types || []).map((vt) => ({
        id: vt.id,
        name: vt.name,
        name_ka: vt.name_ka,
        options: vt.options.map((o) => ({
          id: o.id,
          name: o.name,
          name_ka: o.name_ka,
          price: parseFloat(String(o.price)),
          sale_price: o.sale_price ? parseFloat(String(o.sale_price)) : null,
          discount_percent: o.discount_percent ?? null,
          stock: o.stock,
        })),
      })),
    });

    // Load existing media
    setUploadedMedia(product.media || []);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleAddVariantType = () => {
    formik.setFieldValue('variant_types', [
      ...formik.values.variant_types,
      { name: '', name_ka: '', options: [] },
    ]);
  };

  const handleRemoveVariantType = (typeIndex: number) => {
    formik.setFieldValue(
      'variant_types',
      formik.values.variant_types.filter((_, i) => i !== typeIndex)
    );
  };

  const handleVariantTypeChange = (typeIndex: number, field: 'name' | 'name_ka', value: string) => {
    const updated = [...formik.values.variant_types];
    updated[typeIndex] = { ...updated[typeIndex], [field]: value };
    formik.setFieldValue('variant_types', updated);
  };

  const handleAddOption = (typeIndex: number) => {
    const updated = [...formik.values.variant_types];
    updated[typeIndex] = {
      ...updated[typeIndex],
      options: [
        ...updated[typeIndex].options,
        { name: '', name_ka: '', price: 0, sale_price: null, discount_percent: null, stock: 0 },
      ],
    };
    formik.setFieldValue('variant_types', updated);
  };

  const handleRemoveOption = (typeIndex: number, optionIndex: number) => {
    const updated = [...formik.values.variant_types];
    updated[typeIndex] = {
      ...updated[typeIndex],
      options: updated[typeIndex].options.filter((_, i) => i !== optionIndex),
    };
    formik.setFieldValue('variant_types', updated);
  };

  const handleOptionChange = (
    typeIndex: number,
    optionIndex: number,
    field: string,
    value: string | number | null
  ) => {
    const updated = [...formik.values.variant_types];
    const updatedOptions = [...updated[typeIndex].options];
    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
    updated[typeIndex] = { ...updated[typeIndex], options: updatedOptions };
    formik.setFieldValue('variant_types', updated);
  };

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

  const isMutating = createProductMutation.isPending || updateProductMutation.isPending;

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
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setEditingProduct(null);
              formik.resetForm();
              setUploadedMedia([]);
              setSelectedParentCategoryId('');
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
            {isEditMode ? t('editProduct') : t('createProduct')}
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
                    value={selectedParentCategoryId}
                    onChange={(e) => {
                      const parentId = e.target.value as string;
                      setSelectedParentCategoryId(parentId);
                      const parent = categories.find((c) => c.id === parentId);
                      // If parent has no children, set it as category_id directly
                      if (!parent?.children || parent.children.length === 0) {
                        formik.setFieldValue('category_id', parentId);
                      } else {
                        // Reset category_id until subcategory is selected
                        formik.setFieldValue('category_id', '');
                      }
                    }}
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

              {/* Subcategory */}
              {subcategories.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth error={formik.touched.category_id && Boolean(formik.errors.category_id)}>
                    <InputLabel>{t('subcategory')}</InputLabel>
                    <Select
                      name="category_id"
                      value={formik.values.category_id}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      label={t('subcategory')}
                    >
                      <MenuItem value="" disabled>
                        {t('selectSubcategory')}
                      </MenuItem>
                      {subcategories.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

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

              {/* Variant Types Section */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('variants')}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddCircleOutline />}
                    onClick={handleAddVariantType}
                  >
                    {t('addVariant')}
                  </Button>
                </Stack>

                {formik.values.variant_types.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('noVariantsHint')}
                  </Typography>
                )}

                <Stack spacing={3}>
                  {formik.values.variant_types.map((variantType, typeIndex) => (
                    <Paper key={typeIndex} variant="outlined" sx={{ p: 2, borderRadius: '10px' }}>
                      {/* Variant Type header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="body2" fontWeight={600}>
                          {t('variant')} #{typeIndex + 1}
                        </Typography>
                        <IconButton size="small" color="error" onClick={() => handleRemoveVariantType(typeIndex)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>

                      {/* Variant Type name fields */}
                      <Grid container spacing={2} mb={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={t('variantName')}
                            value={variantType.name}
                            onChange={(e) => handleVariantTypeChange(typeIndex, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={t('variantNameKa')}
                            value={variantType.name_ka}
                            onChange={(e) => handleVariantTypeChange(typeIndex, 'name_ka', e.target.value)}
                          />
                        </Grid>
                      </Grid>

                      {/* Options */}
                      <Stack spacing={2} mb={2}>
                        {variantType.options.map((option, optionIndex) => (
                          <Paper key={optionIndex} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'grey.50' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {t('variantOption')} #{optionIndex + 1}
                              </Typography>
                              <IconButton size="small" color="error" onClick={() => handleRemoveOption(typeIndex, optionIndex)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={t('variantOptionName')}
                                  value={option.name}
                                  onChange={(e) => handleOptionChange(typeIndex, optionIndex, 'name', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={t('variantOptionNameKa')}
                                  value={option.name_ka}
                                  onChange={(e) => handleOptionChange(typeIndex, optionIndex, 'name_ka', e.target.value)}
                                />
                              </Grid>
                              <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label={t('price')}
                                  value={option.price}
                                  onChange={(e) => handleOptionChange(typeIndex, optionIndex, 'price', parseFloat(e.target.value) || 0)}
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">₾</InputAdornment>,
                                  }}
                                />
                              </Grid>
                              <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label={t('salePrice')}
                                  value={option.sale_price || ''}
                                  onChange={(e) =>
                                    handleOptionChange(typeIndex, optionIndex, 'sale_price', e.target.value ? parseFloat(e.target.value) : null)
                                  }
                                  InputProps={{
                                    startAdornment: <InputAdornment position="start">₾</InputAdornment>,
                                  }}
                                />
                              </Grid>
                              <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label={t('discountPercent')}
                                  value={option.discount_percent || ''}
                                  onChange={(e) =>
                                    handleOptionChange(typeIndex, optionIndex, 'discount_percent', e.target.value ? parseInt(e.target.value) : null)
                                  }
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                  }}
                                  inputProps={{ min: 0, max: 100 }}
                                />
                              </Grid>
                              <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  label={t('stock')}
                                  value={option.stock}
                                  onChange={(e) => handleOptionChange(typeIndex, optionIndex, 'stock', parseInt(e.target.value) || 0)}
                                  inputProps={{ min: 0 }}
                                />
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Stack>

                      <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={() => handleAddOption(typeIndex)}
                      >
                        {t('addVariantOption')}
                      </Button>
                    </Paper>
                  ))}
                </Stack>
                <Divider sx={{ mt: 3 }} />
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
                    onClick={resetForm}
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isMutating}
                  >
                    {isMutating ? (
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
                      {product.variant_types && product.variant_types.length > 0 && ` | ${t('variants')}: ${product.variant_types.length}`}
                    </Typography>
                  </Box>
                  <Box textAlign="right" sx={{ mr: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                      ₾{product.price}
                    </Typography>
                    {product.vendor && (
                      <Typography variant="caption" color="text.secondary">
                        {product.vendor.company_name}
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProductToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('delete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('confirmDelete')}</Typography>
          {productToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {productToDelete.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setProductToDelete(null);
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              t('delete')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
