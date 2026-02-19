"use client";

import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Formik, FormikProps } from "formik";
import { object, string } from "yup";
import {
  addDoc,
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { UserDoc } from "../firebase/users/types";
import toast from "react-hot-toast";

interface Inputs {
  fullName: string;
  pinCode: string;
}

export default function Page() {
  const [showBackdrop, setShowBackdrop] = useState(false);

  // Normalize string function (from users controller)
  const normalizeString = (str: string) => {
    return str
      .replaceAll(" ", "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Process full name and generate user data
  const processFullName = (fullName: string) => {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const displayName = `${firstName} ${lastName}`.trim();
    const rawUsername = `${firstName}${lastName}`;
    const user = normalizeString(rawUsername);
    return { firstName, lastName, displayName, user };
  };

  // Check for duplicate usernames and generate unique one
  const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);

    const existingUsers = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as UserDoc),
    })) as UserDoc[];

    const existingUsernames = existingUsers.map(u => u.user);

    let uniqueUsername = baseUsername;
    let counter = 1;

    while (existingUsernames.includes(uniqueUsername)) {
      uniqueUsername = `${baseUsername}${counter}`;
      counter++;
    }

    return uniqueUsername;
  };

  const onSubmit = async (values: Inputs, { resetForm }: { resetForm: () => void }) => {
    try {
      setShowBackdrop(true);

      // Process the full name
      const { firstName, lastName, displayName, user: baseUsername } = processFullName(values.fullName);

      // Generate unique username
      const uniqueUsername = await generateUniqueUsername(baseUsername);

      // Create user document
      const userData: Omit<UserDoc, 'id'> = {
        fullName: values.fullName.trim(),
        firstName,
        lastName,
        user: uniqueUsername,
        displayName,
        pinCode: parseInt(values.pinCode, 10)
      };

      // Add to Firestore
      await addDoc(collection(db, "users"), userData);

      toast.success("Usuário criado com sucesso!");
      resetForm();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Algo deu errado, tente novamente");
    } finally {
      setShowBackdrop(false);
    }
  };

  const requiredMessage = "Campo Obrigatório";

  const schema = object({
    fullName: string()
      .required(requiredMessage)
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
    pinCode: string()
      .required(requiredMessage)
      .matches(/^\d{4}$/, "PIN deve ter exatamente 4 dígitos")
  });

  const CustomTextField = (props: {
    label: string;
    field: keyof Inputs;
    formik: FormikProps<Inputs>;
    type?: string;
  }) => {
    const { label, field, formik, type = "text" } = props;

    return (
      <TextField
        fullWidth
        label={label}
        variant="outlined"
        name={field}
        type={type}
        value={formik.values[field]}
        onChange={formik.handleChange}
        error={Boolean(formik.errors[field])}
        helperText={formik.errors[field]}
      />
    );
  };

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={showBackdrop}
        onClick={() => {}}
      >
        <CircularProgress />
      </Backdrop>

      <Box
        sx={(theme) => ({ bgcolor: theme.palette.primary.main })}
        className="px-4 pt-20 pb-4"
      >
        <Typography variant="h4" color="white">
          Criar Novo Usuário
        </Typography>
      </Box>

      <div className="flex flex-col p-8 gap-4 items-center">
        <Formik<Inputs>
          initialValues={{
            fullName: "",
            pinCode: "",
          }}
          onSubmit={onSubmit}
          validationSchema={schema}
          validateOnChange={false}
        >
          {(formik) => (
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col items-center gap-4 w-full max-w-md"
            >
              <Stack spacing={3} width="100%">
                <CustomTextField
                  label="Nome Completo"
                  field="fullName"
                  formik={formik}
                />
                <CustomTextField
                  label="Código PIN (4 dígitos)"
                  field="pinCode"
                  formik={formik}
                  type="text"
                />
              </Stack>

              <div className="flex w-full justify-end mt-4">
                <Button variant="contained" type="submit" size="large">
                  Criar Usuário
                </Button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    </>
  );
}