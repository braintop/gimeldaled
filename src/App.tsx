import React, { useContext, useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery
} from "@mui/material";
import { Link as RouterLink, Navigate, Route, Routes } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import Home from "./pages/Home";
import Tracking from "./pages/Tracking";
import Teacher from "./pages/Teacher";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Permissions from "./pages/Permissions";
import { auth, fetchUserRole, type UserRole } from "./api/firebase";
import "./index.css";
import { ColorModeContext } from "./theme";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [navAnchorEl, setNavAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);

      if (fbUser) {
        try {
          const r = await fetchUserRole(fbUser.uid);
          setRole(r);
        } catch (err) {
          console.error("Failed to fetch user role", err);
          setRole(null);
        }
      } else {
        setRole(null);
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNavAnchorEl(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setNavAnchorEl(null);
  };

  const RequireAuth = ({ children }: { children: JSX.Element }) => {
    if (!authReady) {
      return (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body1">Loading...</Typography>
        </Box>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  const RequireAdmin = ({ children }: { children: JSX.Element }) => {
    if (!authReady) {
      return (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body1">Loading...</Typography>
        </Box>
      );
    }

    const email = user?.email?.toLowerCase();
    if (!user || email !== "asaf.amir@gmail.com" || role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  const RequireInstructor = ({ children }: { children: JSX.Element }) => {
    if (!authReady) {
      return (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography variant="body1">Loading...</Typography>
        </Box>
      );
    }

    if (!user || (role !== "teacher" && role !== "admin")) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Box className="app-root">
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid rgba(148,163,184,0.25)",
          background:
            "linear-gradient(to right, rgba(15,23,42,0.95), rgba(30,64,175,0.9))",
          backdropFilter: "blur(18px)"
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              gap: 1.5
            }}
          >
            <Box className="app-logo-circle">A</Box>
            <Box>
              <Typography variant="h6" component="div">
                Gimeldaled
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Management System for GIMELDALED
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              color="inherit"
              size="small"
              onClick={colorMode.toggleColorMode}
              sx={{ mr: 0.5 }}
            >
              <span style={{ fontSize: 20 }}>
                {theme.palette.mode === "dark" ? "🌻" : "🌜"}
              </span>
            </IconButton>
            {/* Desktop navigation */}
            {!isMobile && (
              <>
                {user && (
                  <>
                    <Button color="inherit" component={RouterLink} to="/">
                      Home
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/tracking">
                      Tracking
                    </Button>
                    {(role === "teacher" || role === "admin") && (
                      <Button color="inherit" component={RouterLink} to="/teacher">
                        Teacher
                      </Button>
                    )}
                    {user.email?.toLowerCase() === "asaf.amir@gmail.com" &&
                      role === "admin" && (
                        <Button
                          color="inherit"
                          component={RouterLink}
                          to="/permissions"
                        >
                          Permissions
                        </Button>
                      )}
                    <Button color="inherit" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                )}

                {!user && (
                  <>
                    <Button color="inherit" component={RouterLink} to="/login">
                      Login
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/register">
                      Register
                    </Button>
                  </>
                )}
              </>
            )}

            {/* Mobile navigation */}
            {isMobile && (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  onClick={handleOpenNavMenu}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={navAnchorEl}
                  open={Boolean(navAnchorEl)}
                  onClose={handleCloseNavMenu}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right"
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right"
                  }}
                >
                  {user ? (
                    <>
                      <MenuItem
                        component={RouterLink}
                        to="/"
                        onClick={handleCloseNavMenu}
                      >
                        Home
                      </MenuItem>
                      <MenuItem
                        component={RouterLink}
                        to="/tracking"
                        onClick={handleCloseNavMenu}
                      >
                        Tracking
                      </MenuItem>
                      {(role === "teacher" || role === "admin") && (
                        <MenuItem
                          component={RouterLink}
                          to="/teacher"
                          onClick={handleCloseNavMenu}
                        >
                          Teacher
                        </MenuItem>
                      )}
                      {user.email?.toLowerCase() === "asaf.amir@gmail.com" &&
                        role === "admin" && (
                          <MenuItem
                            component={RouterLink}
                            to="/permissions"
                            onClick={handleCloseNavMenu}
                          >
                            Permissions
                          </MenuItem>
                        )}
                      <MenuItem
                        onClick={() => {
                          handleCloseNavMenu();
                          void handleLogout();
                        }}
                      >
                        Logout
                      </MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem
                        component={RouterLink}
                        to="/login"
                        onClick={handleCloseNavMenu}
                      >
                        Login
                      </MenuItem>
                      <MenuItem
                        component={RouterLink}
                        to="/register"
                        onClick={handleCloseNavMenu}
                      >
                        Register
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/tracking"
            element={
              <RequireAuth>
                <Tracking />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher"
            element={
              <RequireInstructor>
                <Teacher />
              </RequireInstructor>
            }
          />
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />
          <Route
            path="/permissions"
            element={
              <RequireAdmin>
                <Permissions />
              </RequireAdmin>
            }
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;


