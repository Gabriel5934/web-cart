import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useFormik } from "formik";
import { object, string } from "yup";
import toast from "react-hot-toast";
import { Context } from "@/context";
import { usePhoneBook } from "@/firebase/phonebook/controller";
import type { PhoneBookEntry } from "@/firebase/phonebook/types";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";

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
  const [isChangingPhoneNumber, setIsChangingPhoneNumber] = useState(false);

  const changePhoneNumber = async () => {
    if (isChangingPhoneNumber || formik.isSubmitting) return;

    try {
      setIsChangingPhoneNumber(true);
      await signOut(auth);
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Não foi possível alterar o celular. Tente novamente.");
    } finally {
      setIsChangingPhoneNumber(false);
    }
  };

  useEffect(() => {
    if (
      context.auth.loading ||
      context.phoneBook.loading ||
      context.phoneBook.error
    ) {
      return;
    }

    if (!context.auth.user) {
      navigate({ to: "/" });
    } else if (context.phoneBook.entry) {
      navigate({ to: "/inicio" });
    }
  }, [
    context.auth.loading,
    context.auth.user,
    context.phoneBook.entry,
    context.phoneBook.error,
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
      if (isChangingPhoneNumber) return;

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
        role: "user",
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

  if (context.phoneBook.error) {
    return (
      <div className="px-4 flex h-screen items-center justify-center">
        <Alert severity="error">
          Não foi possível verificar seu cadastro. Atualize a página e tente
          novamente.
        </Alert>
      </div>
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
          disabled={formik.isSubmitting || isChangingPhoneNumber}
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
          disabled={formik.isSubmitting || isChangingPhoneNumber}
          fullWidth
        />
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={formik.isSubmitting || isChangingPhoneNumber}
        >
          {formik.isSubmitting ? <CircularProgress size={24} /> : "Continuar"}
        </Button>
        <Button
          type="button"
          fullWidth
          disabled={formik.isSubmitting || isChangingPhoneNumber}
          onClick={() => void changePhoneNumber()}
        >
          {isChangingPhoneNumber ? (
            <CircularProgress size={24} />
          ) : (
            "Alterar celular"
          )}
        </Button>
      </Stack>
    </div>
  );
}
