"use client";

import { Box, Container, Divider, Stack } from "@mui/material";
import { usePathname } from "next/navigation";
import { HeaderLogo } from "./header-logo";
import { HeaderSearch } from "./header-search";
import { HeaderActions } from "./header-actions";
import { NavigationLinks } from "./navigation-links";
import { LanguageSwitcher, ProductRequestButton } from "@/components/common";

const HIDDEN_PATH_PREFIXES = ["/admin", "/storage", "/accountant", "/vendor-dashboard"];

export const Header = () => {
  const pathname = usePathname() ?? "";

  // Locale prefix sits before the route — match `/{locale}/admin`, etc.
  const isHiddenRoute = HIDDEN_PATH_PREFIXES.some((prefix) =>
    pathname.includes(prefix)
  );
  if (isHiddenRoute) {
    return null;
  }

  return (
    <Stack
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        width: "100%",
        backgroundColor: "background.paper",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3.5 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Top row */}
        <Stack
          sx={{
            flexDirection: { xs: "column", md: "row" },
            justifyContent: { xs: "flex-start", md: "space-between" },
            alignItems: { xs: "stretch", md: "center" },
            gap: { xs: 2, md: 0 },
          }}
        >
          <Stack direction="row" justifyContent="space-between" gap={1}>
            <HeaderLogo />
            <Stack direction="row" alignItems="center" gap={1} sx={{ display: { xs: "flex", md: "none" }, minWidth: 0 }}>
              {/* Two lines: next to the logo there's no room for one on a phone. */}
              <ProductRequestButton
                sx={{
                  whiteSpace: "normal",
                  lineHeight: 1.1,
                  fontSize: "clamp(9.5px, 2.8vw, 11px)",
                  minHeight: "32px",
                  minWidth: 0,
                  py: 0.5,
                  px: 1,
                }}
              />
              <LanguageSwitcher />
            </Stack>
          </Stack>
          <HeaderSearch />
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <HeaderActions />
          </Box>
        </Stack>

        {/* Bottom row - Navigation */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={3}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <NavigationLinks />
          </Box>
          {/* The top row is full on desktop. The negative margin keeps this row's
              height, which the page's top padding in the layout depends on. */}
          <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0, my: -0.5 }}>
            {/* Breakpoint-keyed because the theme sets button size at the md breakpoint. */}
            <ProductRequestButton sx={{ minHeight: { md: 0 }, height: 32, py: { md: 0 }, px: { md: 2 }, fontSize: { md: "14px" } }} />
          </Box>
        </Stack>
      </Container>
      <Divider />
    </Stack>
  );
};
