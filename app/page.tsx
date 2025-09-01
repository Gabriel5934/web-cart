"use client";

import { Button, Stack, TextField, Typography } from "@mui/material";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { object, string } from "yup";
import { useLoginWithEmailAndPassword } from "./firebase/auth/controller";

export default function Page() {
  const router = useRouter();

  const { signIn } = useLoginWithEmailAndPassword();

  const requiredMessage = "Campo Obrigatório";

  const schema = object({
    email: string().required(requiredMessage),
    password: string().min(4).required(requiredMessage),
  });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const fixedEmail = `${values.email}@webcart.com`;
      const fixedPassword = `${values.password}00`;

      signIn(fixedEmail, fixedPassword).then(() => {
        router.push("/inicio");
      });
    },
  });

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
            value={formik.values.email}
            onChange={formik.handleChange}
            name="email"
            error={Boolean(formik.errors.email)}
            helperText={formik.errors.email}
          />
          <TextField
            label="Senha"
            variant="outlined"
            type="password"
            fullWidth
            value={formik.values.password}
            onChange={formik.handleChange}
            name="password"
            error={Boolean(formik.errors.password)}
            helperText={formik.errors.password}
          />
          <Button variant="contained" color="primary" fullWidth type="submit">
            Entrar
          </Button>
        </Stack>
      </form>
    </div>
  );
}
