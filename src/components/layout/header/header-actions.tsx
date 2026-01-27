import { CartIcon, ProfileIcon } from "@/icons";
import { Button, Stack } from "@mui/material";

export const HeaderActions = () => {
  return (
    <Stack direction="row">
      <Button startIcon={<CartIcon />} sx={{ color: "#5B6ECD" }}>
        კალათა
      </Button>
      <Button
        startIcon={<ProfileIcon />}
        variant="contained"
        sx={{ borderRadius: "100px", padding: "10px 12px" }}
      >
        შესვლა
      </Button>
    </Stack>
  );
};
