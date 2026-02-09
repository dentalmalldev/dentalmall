"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Box, Stack, Typography } from "@mui/material";
import { CartIcon, ProfileIcon, HomeIcon, NavLinkIcon } from "@/icons";
import { BOTTOM_NAV_ITEMS, BottomNavItem } from "@/constants";
import { IconProps } from "@/types/icon-props";
import { useTranslations, useLocale } from "next-intl";
import { useAuth, useAuthModal } from "@/providers";

const iconMap: Record<BottomNavItem["icon"], React.ComponentType<IconProps>> = {
  home: (props) => <HomeIcon {...props} color="#2C2957CC" />,
  category: (props) => <NavLinkIcon {...props} color="#2C2957CC" />,
  cart: (props) => <CartIcon {...props} color="#2C2957CC" />,
  profile: (props) => <ProfileIcon {...props} color="#2C2957CC" />,
};

export function BottomNavigation() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();

  const router = useRouter();

  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // Hide on admin pages
  if (pathname?.includes("/admin")) {
    return null;
  }

  return (
    <Box
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E0E0E0",
        zIndex: 10000000,
        padding: "8px 0",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <Stack direction="row" justifyContent="space-around" alignItems="center">
        {BOTTOM_NAV_ITEMS.map((item, index) => {
          const Icon = iconMap[item.icon];
          if (item.icon === "profile") {
            return (
              <Stack
                alignItems="center"
                gap={0.5}
                onClick={() => {
                  if (user) {
                    router.push("/profile");
                  } else {
                    openAuthModal();
                  }
                }}
                key={index}
              >
                <Icon />
                <Typography fontSize="10px" color="text.primary">
                  {t(item.translationKey)}
                </Typography>
              </Stack>
            );
          }
          return (
            <Link
              key={index}
              href={`/${locale}${item.href}`}
              style={{ textDecoration: "none" }}
            >
              <Stack alignItems="center" gap={0.5}>
                <Icon />
                <Typography fontSize="10px" color="text.primary">
                  {t(item.translationKey)}
                </Typography>
              </Stack>
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}
