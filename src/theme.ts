import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette:
      mode === "dark"
        ? {
            mode,
            primary: {
              main: "#A9C5FF",
              light: "#D7E2FF",
              dark: "#7699DC",
              contrastText: "#102A56",
            },
            background: {
              default: "#071225",
              paper: "#111C31",
            },
            text: {
              primary: "#DCE5FF",
              secondary: "#B9C2D6",
            },
            divider: "#65718A",
            info: {
              main: "#A9C5FF",
            },
          }
        : {
            mode,
          },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}
