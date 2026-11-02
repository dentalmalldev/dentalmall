'use client';

import { useState } from 'react';
import { IconButton, type SxProps, type Theme } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { useAuth, useAuthModal, useFavorites, useSnackbar } from '@/providers';
import { colors } from '@/theme';

interface FavoriteButtonProps {
  productId: string;
  /** "overlay": white disc for sitting on a product image; "outlined": bordered, for the detail page. */
  variant?: 'overlay' | 'outlined';
  sx?: SxProps<Theme>;
}

/**
 * The heart. Filled when the product is saved, outlined when not; the state
 * comes from FavoritesProvider, so every heart for the same product agrees.
 * Logged out, it opens the auth modal and the product is saved automatically
 * after sign-in, like add-to-cart.
 */
export function FavoriteButton({ productId, variant = 'overlay', sx }: FavoriteButtonProps) {
  const t = useTranslations('favorites');
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { isFavorite, toggleFavorite, queueFavorite } = useFavorites();
  const { showSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const saved = isFavorite(productId);

  const handleClick = async (e: React.MouseEvent) => {
    // Never let a click on the heart reach a surrounding link or card.
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      queueFavorite(productId);
      openAuthModal();
      return;
    }

    setBusy(true);
    try {
      await toggleFavorite(productId);
      showSnackbar(saved ? t('removed') : t('added'));
    } catch {
      showSnackbar(t('error'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <IconButton
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? t('remove') : t('add')}
      sx={[
        variant === 'overlay'
          ? {
              width: 36,
              height: 36,
              backgroundColor: 'rgba(255,255,255,0.92)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              '&:hover': { backgroundColor: '#FFFFFF' },
              '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.92)' },
            }
          : {
              width: 48,
              height: 48,
              border: '1px solid',
              borderColor: saved ? colors.accent.main : 'divider',
              borderRadius: '10px',
            },
        { color: colors.accent.main },
        ...(sx === undefined ? [] : Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {saved ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
    </IconButton>
  );
}
