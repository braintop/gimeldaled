import React, { useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { registerWithEmailAndPassword } from "../api/firebase";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function Register() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange =
    (field: keyof RegisterForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await registerWithEmailAndPassword(form);
      // הרשמה הצליחה -> ניקוי הטופס ומעבר למסך לוגאין
      setForm({ firstName: "", lastName: "", email: "", password: "" });
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("הרשמה נכשלה, בדוק את הפרטים ונסה שוב.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" mb={2}>
          Register
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="First name"
              value={form.firstName}
              onChange={handleChange("firstName")}
              required
              fullWidth
            />
            <TextField
              label="Last name"
              value={form.lastName}
              onChange={handleChange("lastName")}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              required
              fullWidth
            />

            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}

            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default Register;


