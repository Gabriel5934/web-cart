import { CopyAll } from "@mui/icons-material";
import { Alert, Box, Button, Link, Typography } from "@mui/material";

export function LoginPage() {
  return (
    <div className="px-4 flex flex-col gap-8 h-screen justify-center">
      <div>
        <Typography variant="h4" component="h1">
          Testemunho Público
        </Typography>
        <Typography variant="h5" component="h1">
          Congregação Aquarius
        </Typography>
        <Alert severity="warning">
          Este link vai parar de funcionar em breve <br />
          Clique no link abaixo para acessar o sistema
        </Alert>
      </div>

      <Link
        sx={{
          textAlign: "center",
        }}
        href="https://aquarius.webcart.digital"
      >
        aquarius.webcart.digital
      </Link>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography fontWeight="bold">
          Clique aqui para copiar o link
        </Typography>
        <Button
          variant="outlined"
          sx={{
            textTransform: "lowercase",
          }}
          endIcon={<CopyAll />}
          fullWidth
        >
          aquarius.webcart.digital
        </Button>
        <Typography>Salve no Whatsapp ou suas notas</Typography>
      </Box>
    </div>
  );
}
