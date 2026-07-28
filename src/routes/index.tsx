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
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebase";
import { Context } from "@/context";

export const Route = createFileRoute("/")({
  component: LoginPage,
});

function toE164(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  return `+55${digits}`;
}

function formatBrazilianPhone(value: string) {
  let digits = value.replace(/\D/g, "");

  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;
  if (digits.length < 8) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/invalid-phone-number":
      return "Número de celular inválido.";
    case "auth/invalid-verification-code":
      return "Código de verificação inválido.";
    case "auth/code-expired":
      return "O código expirou. Solicite um novo.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    case "auth/quota-exceeded":
      return "O limite de mensagens SMS foi atingido.";
    default:
      return "Não foi possível autenticar. Tente novamente.";
  }
}

function LoginPage() {
  const navigate = useNavigate();
  const context = useContext(Context);
  const authEnabled = context.congregation.data?.auth;
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (context.congregation.loading) return;

    if (authEnabled === false) {
      navigate({ to: "/inicio" });
      return;
    }

    if (
      !context.auth.loading &&
      !context.phoneBook.loading &&
      context.auth.user
    ) {
      navigate({
        to: context.phoneBook.entry ? "/inicio" : "/complete-profile",
      });
    }
  }, [
    authEnabled,
    context.congregation.loading,
    context.auth.loading,
    context.auth.user,
    context.phoneBook.entry,
    context.phoneBook.loading,
    navigate,
  ]);

  useEffect(
    () => () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    },
    [],
  );

  const getVerifier = () => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(
        auth,
        "phone-auth-recaptcha",
        { size: "normal" },
      );
    }

    return verifierRef.current;
  };

  const sendCode = async () => {
    const normalizedPhone = toE164(phoneNumber);

    if (phoneNumber.replace(/\D/g, "").length !== 11) {
      toast.error("Digite um número de celular válido com DDD.");
      return;
    }

    try {
      setLoading(true);
      const result = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        getVerifier(),
      );
      setConfirmation(result);
      toast.success("Código enviado por SMS.");
    } catch (error) {
      verifierRef.current?.clear();
      verifierRef.current = null;
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!confirmation || verificationCode.trim().length !== 6) {
      toast.error("Digite o código de 6 dígitos.");
      return;
    }

    try {
      setLoading(true);
      await confirmation.confirm(verificationCode.trim());
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (context.congregation.loading || context.auth.loading) {
    return (
      <Backdrop open>
        <CircularProgress />
      </Backdrop>
    );
  }

  if (!context.congregation.data) {
    return (
      <div className="px-4 flex h-screen items-center justify-center">
        <Alert severity="error">
          Não foi possível carregar os dados da congregação.
        </Alert>
      </div>
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

      <Stack spacing={2}>
        {!confirmation ? (
          <>
            <Alert severity="info">Informe seu celular com DDD.</Alert>
            <TextField
              autoComplete="tel"
              inputMode="numeric"
              label="Celular"
              placeholder="(00) 00000-0000"
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(formatBrazilianPhone(event.target.value))
              }
              disabled={loading}
              fullWidth
              required
            />
            <div id="phone-auth-recaptcha" />
            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={() => void sendCode()}
            >
              {loading ? <CircularProgress size={24} /> : "Enviar código"}
            </Button>
          </>
        ) : (
          <>
            <Alert severity="success">
              Enviamos um código para {toE164(phoneNumber)}.
            </Alert>
            <TextField
              autoComplete="one-time-code"
              inputMode="numeric"
              label="Código de verificação"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(
                  event.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              disabled={loading}
              fullWidth
              required
            />
            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={() => void confirmCode()}
            >
              {loading ? <CircularProgress size={24} /> : "Confirmar código"}
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setConfirmation(null);
                setVerificationCode("");
                setPhoneNumber("");
                verifierRef.current?.clear();
                verifierRef.current = null;
              }}
            >
              Alterar número
            </Button>
          </>
        )}
      </Stack>
    </div>
  );
}
