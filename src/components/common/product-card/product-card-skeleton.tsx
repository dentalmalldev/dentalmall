'use client';

import { Box, Button, Skeleton, Stack, Typography } from '@mui/material';

/**
 * Loading placeholder with ProductCard's exact footprint: the same boxes, type
 * sizes and line heights, so nothing moves when the real card replaces it.
 * Keep it in step with product-card.tsx.
 */
export function ProductCardSkeleton() {
  return (
    <Box
      aria-hidden
      sx={{ borderRadius: '12px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Image */}
      <Skeleton
        variant="rounded"
        sx={{ width: '100%', height: { xs: '170px', sm: '190px', md: '210px' }, borderRadius: '12px' }}
      />

      <Box sx={{ padding: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name: always two lines' worth, like the card */}
        <Typography
          variant="h6"
          sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.35, marginBottom: 0.5, minHeight: '2.7em' }}
        >
          <Skeleton width="90%" />
          <Skeleton width="60%" />
        </Typography>

        {/* Manufacturer */}
        <Typography variant="body2" sx={{ fontSize: '11px', marginBottom: 1.5 }}>
          <Skeleton width="55%" />
        </Typography>

        {/* Price */}
        <Stack direction="row" alignItems="center" sx={{ marginTop: 'auto', marginBottom: 1.5 }}>
          <Typography variant="h5" sx={{ fontSize: '18px', fontWeight: 700, width: '40%' }}>
            <Skeleton />
          </Typography>
        </Stack>

        {/* Add to cart: a hidden copy of the real button sets the exact height */}
        <Skeleton variant="rounded" sx={{ width: '100%', maxWidth: 'none', borderRadius: '100px' }}>
          <Button
            variant="contained"
            fullWidth
            tabIndex={-1}
            sx={{ borderRadius: '100px', padding: '7px 12px', fontSize: '13px', fontWeight: 600 }}
          >
            &nbsp;
          </Button>
        </Skeleton>
      </Box>
    </Box>
  );
}
