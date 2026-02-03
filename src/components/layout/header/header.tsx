import { Box, Divider, Stack } from "@mui/material";
import { HeaderLogo } from "./header-logo";
import { HeaderSearch } from "./header-search";
import { HeaderActions } from "./header-actions";
import { NavigationLinks } from "./navigation-links";
import { LanguageSwitcher } from "@/components/common";

export const Header = () => {
  return (
    <Stack
      component="header"
      sx={{
        // position: { xs: "relative", md: "fixed" },
        top: { md: 0 },
        zIndex: { md: 1100 },
        width: "100%",
        backgroundColor: "background.paper",
      }}
    >
      <Stack sx={{ padding: { xs: "16px 16px", md: "28px 120px" }, gap: 2 }}>
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
      </Stack>
      <Divider />
    </Stack>
  );
};
