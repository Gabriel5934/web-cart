"use client";

import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { useUsers } from "../firebase/users/controller";
import { useState } from "react";
import { User } from "../firebase/users/types";
export default function Page() {
  const { users } = useUsers();

  const autocompleteOptions = users.map((user) => user.displayName);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const onChangeUser = (_: unknown, value: string | null) => {
    const user = users.find((user) => user.displayName === value) || null;
    setSelectedUser(user);
  };

  const copyToClipboard = () => {
    if (selectedUser) {
      navigator.clipboard.writeText(
        `Seu Login e Senha para reserva de carrinho e display\n\nLogin: ${selectedUser.user}\nSenha: ${selectedUser.pinCode}`
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      margin={2}
    >
      <Typography variant="h6" gutterBottom>
        Gerar Mensagem para Usuário
      </Typography>
      <Autocomplete
        disablePortal
        options={autocompleteOptions}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Usuário" />}
        onChange={onChangeUser}
      />
      <Box
        sx={{
          backgroundColor: "#005c4b",
          color: "white",
        }}
        borderRadius={2}
        padding={2}
        margin={2}
      >
        <Typography>
          Seu Login e Senha para reserva de carrinho e display
        </Typography>
        <br />
        <Typography>Login: {selectedUser?.user}</Typography>
        <Typography>Senha: {selectedUser?.pinCode}</Typography>
      </Box>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={copyToClipboard}
      >
        Copiar
      </Button>
    </Box>
  );
}
