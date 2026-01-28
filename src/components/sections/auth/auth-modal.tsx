import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { useTranslations } from "next-intl";
import LogIn from "./log-in";
import { Divider, IconButton, Stack, Tab, Tabs } from "@mui/material";
import { GoogleIcon } from "@/icons/google/google";
import OrDivider from "./or-divider";
import { CloseIcon, LeftIcon } from "@/icons";
import Register from "./register";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: "540px", xs: "100vw" },
  bgcolor: "background.paper",
  borderRadius: { md: "30px", xs: "0px" },
  padding: "40px",
  height: { xs: "100vh" },
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ onClose, open }: AuthModalProps) {
  const t = useTranslations("auth");

  const [value, setValue] = React.useState("authorization");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <IconButton
          sx={{
            position: "absolute",
            right: "0",
            top: "10px",
            display: { xs: "none", md: "block" },
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
         <IconButton
          sx={{
            position: "absolute",
            left: "0",
            top: "40px",
            display: { xs: "block", md: "none" },
          }}
          onClick={onClose}
        >
          <LeftIcon />
        </IconButton>
        <Stack gap={3}>
          <Typography id="modal-modal-title" variant="h3" textAlign="center">
            {t("title")}
          </Typography>
          <Box sx={{ width: "100%" }}>
            <Tabs value={value} onChange={handleChange} variant="fullWidth">
              <Tab value="authorization" label={t("authorization")} />
              <Tab value="register" label={t("register.title")} />
            </Tabs>
          </Box>
          {value === "authorization" ? <LogIn /> : <Register />}
          <OrDivider />
          <Button
            startIcon={<GoogleIcon />}
            variant="outlined"
            sx={{ borderColor: "#D9D9D9" }}
          ></Button>
        </Stack>
      </Box>
    </Modal>
  );
}
