import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Backdrop,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { object, string } from "yup";
import { useEffect } from "react";
import { useUsers } from "@/firebase/users/controller";
import { getConstants } from "@/consts";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const { signIn } = useUsers();
  const { AUTH } = getConstants();

  const requiredMessage = "Campo Obrigatório";

  const schema = object({
    username: string().required(requiredMessage),
    code: string().min(4).required(requiredMessage),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      code: "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      const normalizedUsername = values.username
        .toLowerCase()
        .replaceAll(" ", "");

      signIn(normalizedUsername, values.code).then(() => {
        navigate({ to: "/inicio" });
      });
    },
  });

  useEffect(() => {
    if (!AUTH) {
      navigate({ to: "/inicio" });
    }
  }, [AUTH, navigate]);

  if (!AUTH) {
    return (
      <Backdrop onClick={() => {}} open>
        <CircularProgress />
      </Backdrop>
    );
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
            value={formik.values.username}
            onChange={formik.handleChange}
            name="username"
          />
          <TextField
            label="Senha"
            variant="outlined"
            type="password"
            fullWidth
            value={formik.values.code}
            onChange={formik.handleChange}
            name="code"
          />
          <Button variant="contained" color="primary" fullWidth type="submit">
            Entrar
          </Button>
        </Stack>
      </form>
    </div>
  );
}
