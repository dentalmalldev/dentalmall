"use client";

import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { IconButton } from "@mui/material";
import { CloseIcon, LeftIcon } from "@/icons";
import AuthPanel from "./auth-panel";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: "540px", xs: "100vw" },
  bgcolor: "background.paper",
  borderRadius: { md: "30px", xs: "0px" },
  padding: "40px",
  height: { xs: "100vh", md: "auto" },
  maxHeight: { md: "90vh" },
  overflow: "auto",
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Runs after a successful sign-in. Defaults to just closing the modal. */
  onSuccess?: () => void;
  initialTab?: "authorization" | "register";
}

export default function AuthModal({ onClose, onSuccess, open, initialTab = "authorization" }: AuthModalProps) {
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
        {/* Modal unmounts its content when closed, so each open starts on initialTab. */}
        <AuthPanel initialTab={initialTab} onSuccess={onSuccess ?? onClose} />
      </Box>
    </Modal>
  );
}
