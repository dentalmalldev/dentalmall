import Link from "next/link";
import { NavLinkIcon } from "@/icons";
import { NAV_ITEMS } from "@/constants";
import { Stack, Typography } from "@mui/material";

export function NavigationLinks() {
  return (
    <Stack
      direction="row"
      gap={4}
      sx={{
        overflowX: "auto",
        whiteSpace: "nowrap",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
      }}
    >
      {NAV_ITEMS.map((item, index) => (
        <Link key={index} href={item.href} style={{ textDecoration: "none" }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <NavLinkIcon />
            <Typography color="text.primary" fontSize='14px'>{item.name}</Typography>
          </Stack>
        </Link>
      ))}
    </Stack>
  );
}
