import Image from "next/image";
import styles from "./page.module.css";
import { Button, IconButton, TextField } from "@mui/material";

export default function Home() {
  return (
    <><Button variant="contained">შექმენი ანგარიში</Button><TextField
      label="პაროლი"
      type="password"
    /></>
  );
}
