import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  auth,
  createWeeklyReport,
  getStudentProfile,
  listFuturePlanItemsForStudent,
  listWeeklyReportsForStudent,
  type StudentProfile,
  type FuturePlanItem,
  type WeeklyReportPayload,
  type WeeklyReport,
  createFuturePlanItem,
  updateFuturePlanItemDescription,
  updateStudentProject
} from "../api/firebase";

function Tracking() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectProposalUrl, setProjectProposalUrl] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  const [weekForm, setWeekForm] = useState<WeeklyReportPayload>({
    weekStartDate: new Date(),
    weeklyStatusText: "",
    blockersText: "",
    nextWeekDemoText: "",
    nextWeekTasksText: ""
  });
  const [savingReport, setSavingReport] = useState(false);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [planItems, setPlanItems] = useState<FuturePlanItem[]>([]);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const load = async () => {
      const p = await getStudentProfile(user.uid);
      if (p) {
        setProfile(p);
        setProjectTitle(p.projectTitle);
        setProjectProposalUrl(p.projectProposalUrl);
      }

      const r = await listWeeklyReportsForStudent(user.uid);
      setReports(r);

      const plans = await listFuturePlanItemsForStudent(user.uid);
      setPlanItems(plans);
    };

    void load();
  }, []);

  const handleSaveProject = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSavingProject(true);
    try {
      await updateStudentProject(user.uid, {
        projectTitle,
        projectProposalUrl
      });
      setProfile((prev) =>
        prev
          ? { ...prev, projectTitle, projectProposalUrl }
          : (prev as StudentProfile | null)
      );
    } finally {
      setSavingProject(false);
    }
  };

  const handleSubmitWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setSavingReport(true);
    try {
      await createWeeklyReport(user.uid, weekForm);
      const r = await listWeeklyReportsForStudent(user.uid);
      setReports(r);
      if (r.length > 0) {
        setSelectedReport(r[0]);
      }
      setWeekForm({
        weekStartDate: new Date(),
        weeklyStatusText: "",
        blockersText: "",
        nextWeekDemoText: "",
        nextWeekTasksText: ""
      });
    } finally {
      setSavingReport(false);
    }
  };

  const handleAddPlanItem = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const maxWeek =
      planItems.length > 0
        ? Math.max(...planItems.map((p) => p.weekIndex))
        : 0;
    if (maxWeek >= 20) return;

    const newWeekIndex = maxWeek + 1;
    const created = await createFuturePlanItem(user.uid, newWeekIndex);
    setPlanItems((prev) =>
      [...prev, created].sort((a, b) => a.weekIndex - b.weekIndex)
    );
  };

  const handleChangePlanDescription = (id: string, value: string) => {
    setPlanItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, description: value } : p))
    );
  };

  const handleChangePlanTillDate = (id: string, value: string) => {
    setPlanItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              tillDate: value ? new Date(value) : null
            }
          : p
      )
    );
  };

  const handleSavePlanItem = async (item: FuturePlanItem) => {
    setSavingPlanId(item.id);
    try {
      let tillDateValue: Date | null = null;
      if (item.tillDate) {
        if (item.tillDate instanceof Date) {
          tillDateValue = item.tillDate;
        } else {
          tillDateValue = item.tillDate.toDate();
        }
      }

      await updateFuturePlanItemDescription(item.id, {
        description: item.description,
        tillDate: tillDateValue
      });
    } finally {
      setSavingPlanId(null);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

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
          p: 2,
          width: { xs: "100%", md: 260 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Typography variant="subtitle1">Weekly Reports</Typography>
          <IconButton
            size="small"
            color="primary"
            onClick={() => setShowWeekForm(true)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        <Stack spacing={1}>
          {reports.map((r) => (
            <Box
              key={r.id}
              sx={{
                p: 1.2,
                borderRadius: 1,
                bgcolor:
                  selectedReport && selectedReport.id === r.id
                    ? "rgba(59,130,246,0.18)"
                    : "rgba(15,23,42,0.85)",
                color: "#e5e7eb",
                cursor: "pointer"
              }}
              onClick={() => setSelectedReport(r)}
            >
              <Typography variant="body2" fontWeight={600}>
                {r.weekStartDate instanceof Date
                  ? r.weekStartDate.toDateString()
                  : new Date(
                      (r.weekStartDate as any).toDate()
                    ).toDateString()}
              </Typography>
              <Typography variant="body2" noWrap sx={{ opacity: 0.9 }}>
                {r.weeklyStatusText || "No status"}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" mb={2}>
            Project
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Project Title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Project Proposal URL"
              value={projectProposalUrl}
              onChange={(e) => setProjectProposalUrl(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={handleSaveProject}
              disabled={savingProject}
            >
              {savingProject ? "Saving..." : "Save Project"}
            </Button>
          </Stack>
        </Paper>

        {showWeekForm && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Weekly Report
            </Typography>

            <Box component="form" onSubmit={handleSubmitWeek}>
              <Stack spacing={2}>
                <TextField
                  label="Week start date"
                  type="date"
                  value={weekForm.weekStartDate.toISOString().slice(0, 10)}
                  onChange={(e) =>
                    setWeekForm((prev) => ({
                      ...prev,
                      weekStartDate: new Date(e.target.value)
                    }))
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: todayIso }}
                />
                <TextField
                  label="Short description of this week’s status"
                  value={weekForm.weeklyStatusText}
                  onChange={(e) =>
                    setWeekForm((prev) => ({
                      ...prev,
                      weeklyStatusText: e.target.value
                    }))
                  }
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Is there anything blocking my progress?"
                  value={weekForm.blockersText}
                  onChange={(e) =>
                    setWeekForm((prev) => ({
                      ...prev,
                      blockersText: e.target.value
                    }))
                  }
                  multiline
                  minRows={2}
                />
                <TextField
                  label="Next week I will present"
                  value={weekForm.nextWeekDemoText}
                  onChange={(e) =>
                    setWeekForm((prev) => ({
                      ...prev,
                      nextWeekDemoText: e.target.value
                    }))
                  }
                  multiline
                  minRows={2}
                />
                <TextField
                  label="My tasks for next week are"
                  value={weekForm.nextWeekTasksText}
                  onChange={(e) =>
                    setWeekForm((prev) => ({
                      ...prev,
                      nextWeekTasksText: e.target.value
                    }))
                  }
                  multiline
                  minRows={2}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingReport}
                >
                  {savingReport ? "Saving..." : "Submit weekly report"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        )}

        {selectedReport && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>
              Weekly Report (read only)
            </Typography>
            <Stack spacing={1.5}>
              <Typography variant="body2">
                <strong>Week start date:</strong>{" "}
                {selectedReport.weekStartDate instanceof Date
                  ? selectedReport.weekStartDate.toDateString()
                  : new Date(
                      (selectedReport.weekStartDate as any).toDate()
                    ).toDateString()}
              </Typography>
              <Typography variant="body2">
                <strong>Short description of this week’s status:</strong>{" "}
                {selectedReport.weeklyStatusText || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Is there anything blocking my progress?</strong>{" "}
                {selectedReport.blockersText || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>Next week I will present:</strong>{" "}
                {selectedReport.nextWeekDemoText || "-"}
              </Typography>
              <Typography variant="body2">
                <strong>My tasks for next week are:</strong>{" "}
                {selectedReport.nextWeekTasksText || "-"}
              </Typography>
            </Stack>
          </Paper>
        )}
      </Box>

      <Paper
        sx={{
          p: 2,
          width: { xs: "100%", md: 260 },
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Typography variant="subtitle1">Project plan</Typography>
          <IconButton size="small" color="primary" onClick={handleAddPlanItem}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        <Stack spacing={1}>
          {planItems.map((item) => (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 1 }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Week {item.weekIndex}
              </Typography>
              <TextField
                value={item.description}
                onChange={(e) =>
                  handleChangePlanDescription(item.id, e.target.value)
                }
                placeholder="What is your plan for this week?"
                multiline
                minRows={2}
                fullWidth
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  gap: 1
                }}
              >
                <TextField
                  label="Till date"
                  type="date"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={
                    item.tillDate
                      ? item.tillDate instanceof Date
                        ? item.tillDate.toISOString().slice(0, 10)
                        : item.tillDate.toDate().toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    handleChangePlanTillDate(item.id, e.target.value)
                  }
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleSavePlanItem(item)}
                  disabled={savingPlanId === item.id}
                >
                  {savingPlanId === item.id ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

export default Tracking;


