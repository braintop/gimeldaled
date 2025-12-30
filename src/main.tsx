import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import "./index.css";
import { ColorModeContext } from "./theme";

type Mode = "light" | "dark";

function Root() {
  const [mode, setMode] = useState<Mode>("dark");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
      }
    }),
    []
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#2563eb"
          },
          secondary: {
            main: "#f59e0b"
          },
          background: {
            default: mode === "light" ? "#f3f4f6" : "#020617",
            paper:
              mode === "light" ? "#ffffff" : "rgba(15,23,42,0.96)"
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#e5e7eb",
            secondary: mode === "light" ? "#4b5563" : "#9ca3af"
          }
        },
        shape: {
          borderRadius: 16
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                border: "1px solid rgba(148,163,184,0.25)"
              }
            }
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 999
              }
            }
          }
        }
      }),
    [mode]
  );

  return (
    <React.StrictMode>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Root />
);


