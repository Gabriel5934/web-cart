import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Backdrop,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect } from "react";
import { useFormik } from "formik";
import { object, string } from "yup";
import toast from "react-hot-toast";
import { Context } from "@/context";
import { usePhoneBook } from "@/firebase/phonebook/controller";
import type { PhoneBookEntry } from "@/firebase/phonebook/types";

export const Route = createFileRoute("/complete-profile")({
  component: CompleteProfilePage,
});

const oneWordNameSchema = string()
  .trim()
  .min(2, "Digite pelo menos 2 letras.")
  .matches(
    /^\p{L}+$/u,
    "Use somente uma palavra, sem espaços, números ou símbolos."
  )
  .required("Campo obrigatório.");

const profileSchema = object({
  firstName: oneWordNameSchema,
  lastName: oneWordNameSchema,
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const context = useContext(Context);
  const { saveEntry } = usePhoneBook();

  useEffect(() => {
    if (context.auth.loading || context.phoneBook.loading) return;

    if (!context.auth.user) {
      navigate({ to: "/" });
    } else if (context.phoneBook.entry) {
      navigate({ to: "/inicio" });
    }
  }, [
    context.auth.loading,
    context.auth.user,
    context.phoneBook.entry,
    context.phoneBook.loading,
    navigate,
  ]);

  const formik = useFormik({
    initialValues: {
      firstName: "",
      lastName: "",
    },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      const normalizedFirstName = values.firstName.trim().toLowerCase();
      const normalizedLastName = values.lastName.trim().toLowerCase();
      const user = context.auth.user;

      if (!user?.phoneNumber) {
        toast.error("O usuário autenticado não possui um celular válido.");
        return;
      }

      const entry: PhoneBookEntry = {
        authUid: user.uid,
        phoneNumber: user.phoneNumber,
        congregation: "jardim-esplanada",
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        displayName: `${normalizedFirstName} ${normalizedLastName}`,
      };

      try {
        await saveEntry(entry);
        context.phoneBook.setEntry(entry);
        navigate({ to: "/inicio" });
      } catch (error) {
        console.error("Error saving phone-book profile:", error);
        toast.error("Não foi possível salvar seus dados. Tente novamente.");
      }
    },
  });

  if (context.auth.loading || context.phoneBook.loading) {
    return (
      <Backdrop open>
        <CircularProgress />
      </Backdrop>
    );
  }

  return (
    <div className="px-4 flex flex-col gap-2 h-screen justify-center">
      <Typography variant="h4" component="h1">
        Complete seu cadastro
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        Informe seu nome para associá-lo ao celular{" "}
        {context.auth.user?.phoneNumber}.
      </Typography>

      <Stack component="form" spacing={2} onSubmit={formik.handleSubmit}>
        <TextField
          autoComplete="given-name"
          label="Nome"
          name="firstName"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.firstName && Boolean(formik.errors.firstName)}
          helperText={formik.touched.firstName && formik.errors.firstName}
          disabled={formik.isSubmitting}
          fullWidth
        />
        <TextField
          autoComplete="family-name"
          label="Sobrenome"
          name="lastName"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.lastName && Boolean(formik.errors.lastName)}
          helperText={formik.touched.lastName && formik.errors.lastName}
          disabled={formik.isSubmitting}
          fullWidth
        />
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? <CircularProgress size={24} /> : "Continuar"}
        </Button>
      </Stack>
    </div>
  );
}
