"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import { object, string } from "yup";
import { login } from "../firebase/users/controller";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { Context } from "../context";

export default function Page() {
  const requiredMessage = "Campo Obrigatório";
  const router = useRouter();
  const context = useContext(Context);

  const schema = object({
    user: string().required(requiredMessage),
    pinCode: string().min(4).required(requiredMessage),
  });

  const formik = useFormik({
    initialValues: {
      user: "",
      pinCode: "",
    },
    validationSchema: schema,
    onSubmit: async (data) => {
      try {
        await login(data);
        router.push("/inicio");
      } catch (_e) {
        const error = _e as Error;
        toast.error(error.message);
      }
    },
  });

  if (context.user) {
    return router.push("/inicio");
  }

  return (
    <div className="px-4 flex flex-col gap-2 h-screen justify-center">
      <Typography variant="h4" component="h1">
        Testemunho Público
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        Jardim Esplanada
      </Typography>
      <form onSubmit={formik.handleSubmit}>
        <Stack spacing={2}>
          <TextField
            label="Usuário"
            variant="outlined"
            fullWidth
            value={formik.values.user}
            onChange={formik.handleChange}
            name="user"
          />
          <TextField
            label="Senha"
            variant="outlined"
            type="password"
            fullWidth
            value={formik.values.pinCode}
            onChange={formik.handleChange}
            name="pinCode"
          />
          <Button variant="contained" color="primary" fullWidth type="submit">
            Entrar
          </Button>
        </Stack>
      </form>
    </div>
  );
}
