"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge, Box, Stack, Typography } from "@mui/material";
import { CartIcon, ProfileIcon, HomeIcon, NavLinkIcon } from "@/icons";
import { BOTTOM_NAV_ITEMS, BottomNavItem } from "@/constants";
import { IconProps } from "@/types/icon-props";
import { useTranslations, useLocale } from "next-intl";
import { useAuth, useAuthModal, useCart } from "@/providers";
// "#2C2957CC"

const iconMap: Record<BottomNavItem["icon"], React.ComponentType<IconProps>> = {
  home: (props) => <HomeIcon {...props} color={props.color} />,
  category: (props) => <NavLinkIcon {...props} color={props.color} />,
  cart: (props) => <CartIcon {...props} color={props.color} />,
  profile: (props) => <ProfileIcon {...props} color={props.color} />,
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

  console.log("PAth:", pathname);

  const { items } = useCart();

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
                <Icon
                  color={pathname.includes("profile") ? "#9292FF" : "#2C2957CC"}
                />
                <Typography fontSize="10px" color="text.primary">
                  {t(item.translationKey)}
                </Typography>
              </Stack>
            );
          }
          if (item.icon === "cart") {
            return (
              <Stack
                alignItems="center"
                gap={0.5}
                onClick={() => {
                  if (user) {
                    router.push("/cart");
                  } else {
                    openAuthModal();
                  }
                }}
                key={index}
              >
                <Badge
                  badgeContent={items.length}
                  color="secondary"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#9292FF",
                      color: "white",
                      fontSize: "10px",
                      minWidth: "18px",
                      height: "18px",
                    },
                  }}
                >
                  <Icon
                    color={pathname.includes("cart") ? "#9292FF" : "#2C2957CC"}
                  />
                </Badge>

                <Typography fontSize="10px" color="text.primary">
                  {t(item.translationKey)}
                </Typography>
              </Stack>
            );
          }
          if (item.icon === "home") {
            return (
              <Link
                key={index}
                href={`/${locale}${item.href}`}
                style={{ textDecoration: "none" }}
              >
                <Stack alignItems="center" gap={0.5}>
                  <Icon color={pathname === "/ka" ? "#9292FF" : "#2C2957CC"} />
                  <Typography fontSize="10px" color="text.primary">
                    {t(item.translationKey)}
                  </Typography>
                </Stack>
              </Link>
            );
          }
          if (item.icon === "category") {
            return (
              <Link
                key={index}
                href={`/${locale}${item.href}`}
                style={{ textDecoration: "none" }}
              >
                <Stack alignItems="center" gap={0.5}>
                  <Icon
                    color={
                      pathname.includes("categories") ? "#9292FF" : "#2C2957CC"
                    }
                  />
                  <Typography fontSize="10px" color="text.primary">
                    {t(item.translationKey)}
                  </Typography>
                </Stack>
              </Link>
            );
          }
        })}
      </Stack>
    </Box>
  );
}
