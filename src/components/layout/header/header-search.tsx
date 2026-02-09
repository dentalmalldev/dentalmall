'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Chip,
  ClickAwayListener,
} from '@mui/material';
import { SearchIcon } from '@/icons';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/models';
import Image from 'next/image';

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <Box
            key={i}
            component="span"
            sx={{ backgroundColor: 'rgba(91, 110, 205, 0.2)', fontWeight: 700, borderRadius: '2px' }}
          >
            {part}
          </Box>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export const HeaderSearch = () => {
  const t = useTranslations('actions');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setDebouncedQuery('');
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery) return;
    let cancelled = false;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setResults(data.data || []);
          setTotalResults(data.pagination?.total || 0);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setTotalResults(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResults();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  const handleClickProduct = useCallback((productId: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/${locale}/products/${productId}`);
  }, [locale, router]);

  const handleClose = () => {
    setOpen(false);
  };

  const getProductName = (product: Product) =>
    locale === 'ka' ? product.name_ka : product.name;

  const getCategoryName = (product: Product) =>
    product.category
      ? locale === 'ka' ? product.category.name_ka : product.category.name
      : null;

  const getPrice = (product: Product) => {
    const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
    const price = parseFloat(product.price);
    return { price, salePrice };
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: 'relative', width: { xs: '100%', md: '500px' } }}>
        <TextField
          inputRef={inputRef}
          placeholder={t('search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (debouncedQuery && results.length > 0) setOpen(true);
          }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon />,
              endAdornment: loading ? <CircularProgress size={20} /> : null,
            },
          }}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '100px',
              '& fieldset': { borderColor: '#5B6ECD' },
              '&:hover fieldset': { borderColor: '#5B6ECD' },
              '&.Mui-focused fieldset': { borderColor: '#5B6ECD' },
            },
          }}
        />

        {open && debouncedQuery && (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              zIndex: 1300,
              borderRadius: '16px',
              overflow: 'hidden',
              maxHeight: 480,
              overflowY: 'auto',
            }}
          >
            {results.length === 0 && !loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">{t('noResults')}</Typography>
              </Box>
            ) : (
              <Stack>
                {results.map((product) => {
                  const { price, salePrice } = getPrice(product);
                  const categoryName = getCategoryName(product);
                  const imageUrl = product.media?.[0]?.url;

                  return (
                    <Box
                      key={product.id}
                      onClick={() => handleClickProduct(product.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        px: 2,
                        py: 1.5,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        '&:hover': { backgroundColor: 'action.hover' },
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      {/* Product Image */}
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          bgcolor: 'grey.100',
                        }}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={getProductName(product)}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="50px"
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Product Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          <HighlightText text={getProductName(product)} query={debouncedQuery} />
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                          {categoryName && (
                            <Chip
                              label={<HighlightText text={categoryName} query={debouncedQuery} />}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                          {product.vendor && (
                            <Chip
                              label={product.vendor.company_name}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                setQuery('');
                                router.push(`/${locale}/vendors/${product.vendor!.id}`);
                              }}
                            />
                          )}
                          {product.manufacturer && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              <HighlightText text={product.manufacturer} query={debouncedQuery} />
                            </Typography>
                          )}
                        </Stack>
                      </Box>

                      {/* Price */}
                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {salePrice ? `${salePrice.toFixed(2)}₾` : `${price.toFixed(2)}₾`}
                        </Typography>
                        {salePrice && (
                          <Typography
                            variant="caption"
                            sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
                          >
                            {price.toFixed(2)}₾
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}

                {totalResults > results.length && (
                  <Box
                    onClick={() => {
                      setOpen(false);
                      router.push(`/${locale}/categories?search=${encodeURIComponent(debouncedQuery)}`);
                    }}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      {t('viewAll')} ({totalResults})
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};
