"use client";

import { Box, Container, Divider, Stack } from "@mui/material";
import { usePathname } from "next/navigation";
import { HeaderLogo } from "./header-logo";
import { HeaderSearch } from "./header-search";
import { HeaderActions } from "./header-actions";
import { NavigationLinks } from "./navigation-links";
import { LanguageSwitcher } from "@/components/common";

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
          <Stack direction="row" justifyContent="space-between">
            <HeaderLogo />
            <Box sx={{ display: { xs: "block", md: "none" } }}>
              <LanguageSwitcher />
            </Box>
          </Stack>
          <HeaderSearch />
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <HeaderActions />
          </Box>
        </Stack>

        {/* Bottom row - Navigation */}
        <NavigationLinks />
      </Container>
      <Divider />
    </Stack>
  );
};
