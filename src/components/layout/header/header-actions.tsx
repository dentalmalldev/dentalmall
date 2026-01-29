"use client";

import { CartIcon, ProfileIcon } from "@/icons";
import { Badge, Button, Stack, Menu, MenuItem, Typography, Divider } from "@mui/material";
import { useTranslations, useLocale } from "next-intl";
import { LanguageSwitcher } from "@/components/common";
import AuthModal from "@/components/sections/auth/auth-modal";
import { useState } from "react";
import { useCart, useAuth } from "@/providers";
import Link from "next/link";

export const HeaderActions = () => {
  const t = useTranslations("actions");
  const locale = useLocale();
  const { user, dbUser, logout } = useAuth();
  const { items } = useCart();

  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    if (user) {
      setAnchorEl(event.currentTarget);
    } else {
      setOpenAuthModal(true);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  return (
    <Stack direction="row" gap={1} alignItems="center">
      {/* Cart Button */}
      <Button
        component={Link}
        href={`/${locale}/cart`}
        startIcon={
          <Badge
            badgeContent={items.length}
            color="secondary"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#9292FF',
                color: 'white',
                fontSize: '10px',
                minWidth: '18px',
                height: '18px',
              }
            }}
          >
            <CartIcon />
          </Badge>
        }
        sx={{
          color: "#5B6ECD",
          '&:hover': {
            backgroundColor: 'rgba(91, 110, 205, 0.08)',
          }
        }}
      >
        {t("cart")}
      </Button>

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Profile / Login Button */}
      {user ? (
        <>
          <Button
            startIcon={<ProfileIcon />}
            variant="contained"
            onClick={handleProfileClick}
            sx={{
              borderRadius: "100px",
              padding: "10px 16px",
              textTransform: 'none',
            }}
          >
            {dbUser?.first_name || user.displayName?.split(' ')[0] || t("login")}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            sx={{
              mt: 1,
              '& .MuiPaper-root': {
                borderRadius: '12px',
                minWidth: '200px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            <MenuItem sx={{ pointerEvents: 'none' }}>
              <Stack>
                <Typography variant="body1" fontWeight={600}>
                  {dbUser?.first_name} {dbUser?.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dbUser?.email || user.email}
                </Typography>
              </Stack>
            </MenuItem>
            <Divider />
            <MenuItem
              component={Link}
              href={`/${locale}/profile`}
              onClick={handleMenuClose}
            >
              {locale === 'ka' ? 'პროფილი' : 'Profile'}
            </MenuItem>
            <MenuItem
              component={Link}
              href={`/${locale}/cart`}
              onClick={handleMenuClose}
            >
              {locale === 'ka' ? 'კალათა' : 'Cart'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              {locale === 'ka' ? 'გასვლა' : 'Logout'}
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          startIcon={<ProfileIcon />}
          variant="contained"
          onClick={() => setOpenAuthModal(true)}
          sx={{
            borderRadius: "100px",
            padding: "10px 16px",
          }}
        >
          {t("login")}
        </Button>
      )}

      <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />
    </Stack>
  );
};
