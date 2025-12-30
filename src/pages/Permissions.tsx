import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import {
  AppUser,
  UserRole,
  getAllUsersWithRoles,
  updateUserRole
} from "../api/firebase";

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student"
};

function Permissions() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getAllUsersWithRoles();
      setUsers(data);
    };
    void load();
  }, []);

  const handleChangeRole = (uid: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
    );
  };

  const handleSaveRole = async (uid: string, role: UserRole) => {
    try {
      setSaving(uid);
      await updateUserRole(uid, role);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 800 }}>
        <Typography variant="h5" mb={2}>
          הרשאות משתמשים
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell>{u.email ?? "-"}</TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <InputLabel id={`role-${u.uid}`}>Role</InputLabel>
                    <Select
                      labelId={`role-${u.uid}`}
                      label="Role"
                      value={u.role}
                      onChange={(e) =>
                        handleChangeRole(u.uid, e.target.value as UserRole)
                      }
                    >
                      <MenuItem value="admin">{roleLabels.admin}</MenuItem>
                      <MenuItem value="teacher">{roleLabels.teacher}</MenuItem>
                      <MenuItem value="student">{roleLabels.student}</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={saving === u.uid}
                    onClick={() => handleSaveRole(u.uid, u.role)}
                  >
                    {saving === u.uid ? "Saving..." : "Save"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default Permissions;


