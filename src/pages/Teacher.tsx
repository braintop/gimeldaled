import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  auth,
  getLatestWeeklyReportForStudent,
  listAllStudents,
  listFuturePlanItemsForStudent,
  listWeeklyReportsForStudent,
  type FuturePlanItem,
  type StudentProfile,
  type WeeklyReport,
  updateInstructorNotes
} from "../api/firebase";

type Status = "On track" | "At risk" | "Missing report";

interface StudentRow {
  student: StudentProfile;
  latestReport: WeeklyReport | null;
  status: Status;
}

function computeStatus(latestReport: WeeklyReport | null): Status {
  if (!latestReport) return "Missing report";
  const now = new Date();
  const weekDate =
    latestReport.weekStartDate instanceof Date
      ? latestReport.weekStartDate
      : // @ts-expect-error Firestore Timestamp
        latestReport.weekStartDate.toDate();
  const diffDays = (now.getTime() - weekDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return "On track";
  if (diffDays <= 14) return "At risk";
  return "Missing report";
}

function statusColor(status: Status) {
  switch (status) {
    case "On track":
      return "success";
    case "At risk":
      return "warning";
    case "Missing report":
      return "error";
    default:
      return "default";
  }
}

function Teacher() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [plans, setPlans] = useState<FuturePlanItem[]>([]);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const current = auth.currentUser;
        if (!current) return;

        // לעתיד: אפשר לסנן לפי instructorId === current.uid
        const students = await listAllStudents();
        const latestPromises = students.map((s) =>
          getLatestWeeklyReportForStudent(s.uid)
        );
        const latest = await Promise.all(latestPromises);

        const combined: StudentRow[] = students.map((s, idx) => ({
          student: s,
          latestReport: latest[idx],
          status: computeStatus(latest[idx])
        }));

        setRows(combined);
        if (combined.length > 0) {
          const first = combined[0];
          setSelected(first);
          const [studentReports, studentPlans] = await Promise.all([
            listWeeklyReportsForStudent(first.student.uid),
            listFuturePlanItemsForStudent(first.student.uid)
          ]);
          setReports(studentReports);
          setPlans(studentPlans);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSelect = async (row: StudentRow) => {
    setSelected(row);
    const [studentReports, studentPlans] = await Promise.all([
      listWeeklyReportsForStudent(row.student.uid),
      listFuturePlanItemsForStudent(row.student.uid)
    ]);
    setReports(studentReports);
    setPlans(studentPlans);
  };

  const handleChangeNotes = (id: string, value: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, instructorNotesText: value } : r
      )
    );
  };

  const handleSaveNotes = async (report: WeeklyReport) => {
    setSavingNotesId(report.id);
    try {
      await updateInstructorNotes(report.id, report.instructorNotesText || "");
    } finally {
      setSavingNotesId(null);
    }
  };

  const missingThisWeekCount = useMemo(
    () => rows.filter((r) => r.status === "Missing report").length,
    [rows]
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        flexDirection: { xs: "column", md: "row" }
      }}
    >
      <Paper
        sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5
        }}
      >
        <Typography variant="h6">Students</Typography>
        {loading && <LinearProgress />}
        <Typography variant="body2" color="text.secondary">
          Missing this week: {missingThisWeekCount}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <List
          dense
          sx={{
            maxHeight: { xs: 260, md: 500 },
            overflowY: "auto"
          }}
        >
          {rows.map((row) => (
            <ListItem key={row.student.uid} disablePadding>
              <ListItemButton
                selected={selected?.student.uid === row.student.uid}
                onClick={() => handleSelect(row)}
              >
                <ListItemText
                  primary={`${row.student.firstName} ${row.student.lastName}`}
                  secondary={
                    <>
                      <Typography variant="caption" component="span">
                        {row.student.projectTitle || "No project title"}
                      </Typography>
                      <br />
                      <Chip
                        size="small"
                        label={row.status}
                        color={statusColor(row.status)}
                        sx={{ mt: 0.5 }}
                      />
                    </>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Student overview
          </Typography>
          {selected ? (
            <>
              <Typography variant="subtitle1">
                {selected.student.firstName} {selected.student.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.student.email}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Project:</strong>{" "}
                {selected.student.projectTitle || "Not set yet"}
              </Typography>
              <Typography variant="body2">
                <strong>Proposal URL:</strong>{" "}
                {selected.student.projectProposalUrl || "-"}
              </Typography>
            </>
          ) : (
            <Typography variant="body2">Select a student from the list.</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Weekly reports
          </Typography>
          {reports.length === 0 ? (
            <Typography variant="body2">No reports yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {reports.map((r) => (
                <Box
                  key={r.id}
                  sx={{ borderRadius: 1, border: "1px solid #e2e8f0", p: 1.5 }}
                >
                  <Typography variant="subtitle2">
                    {r.weekStartDate instanceof Date
                      ? r.weekStartDate.toDateString()
                      : // @ts-expect-error Firestore Timestamp
                        r.weekStartDate.toDate().toDateString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {r.weeklyStatusText || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Blockers:</strong> {r.blockersText || "-"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Next week demo:</strong> {r.nextWeekDemoText || "-"}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Next week tasks:</strong> {r.nextWeekTasksText || "-"}
                  </Typography>
                  <TextField
                    label="Instructor notes"
                    value={r.instructorNotesText || ""}
                    onChange={(e) => handleChangeNotes(r.id, e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                    <Chip
                      label={
                        savingNotesId === r.id ? "Saving..." : "Save instructor notes"
                      }
                      color="primary"
                      onClick={() => handleSaveNotes(r)}
                      clickable
                      disabled={savingNotesId === r.id}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Project plan (future weeks)
          </Typography>
          {plans.length === 0 ? (
            <Typography variant="body2">No future plan items yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {plans.map((p) => (
                <Box
                  key={p.id}
                  sx={{ borderRadius: 1, border: "1px solid #e2e8f0", p: 1.5 }}
                >
                  <Typography variant="subtitle2">
                    Week {p.weekIndex}
                  </Typography>
                  <Typography variant="body2">
                    {p.description || "No description yet."}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default Teacher;


