"use client";

import Link from "next/link";
import { Box, Stack, Typography } from "@mui/material";
import { CartIcon, ProfileIcon, HomeIcon, CategoryIcon } from "@/icons";
import { BOTTOM_NAV_ITEMS, BottomNavItem } from "@/constants";

const iconMap: Record<BottomNavItem["icon"], React.ComponentType> = {
  home: HomeIcon,
  category: CategoryIcon,
  cart: CartIcon,
  profile: ProfileIcon,
};

export function BottomNavigation() {
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
        zIndex: 1000,
        padding: "8px 0",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <Stack direction="row" justifyContent="space-around" alignItems="center">
        {BOTTOM_NAV_ITEMS.map((item, index) => {
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={index}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              <Stack alignItems="center" gap={0.5}>
                <Icon />
                <Typography fontSize="10px" color="text.primary">
                  {item.name}
                </Typography>
              </Stack>
            </Link>
          );
        })}
      </Stack>
    </Box>
  );
}
