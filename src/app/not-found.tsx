"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@/theme";

export default function RootNotFound() {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider>
        <Stack
          sx={{
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: 3,
          }}
        >
          <Image
            src="/assets/not-found.png"
            alt="Page not found"
            width={400}
            height={300}
            style={{ objectFit: "contain" }}
          />

          <Stack direction="column" gap={2} mt={4}>
            <Typography textAlign="center">გვერდი ვერ მოიძებნა</Typography>
            <Button variant="contained" component={Link} href="/ka">
              მთავარ გვერდზე დაბრუნება
            </Button>
          </Stack>
        </Stack>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
