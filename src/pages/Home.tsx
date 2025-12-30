import React from "react";
import { Box, Paper, Typography } from "@mui/material";

function Home() {
  return (
    <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
      <Paper sx={{ p: 3, maxWidth: 900, width: "100%" }}>
        <Typography variant="h5" gutterBottom>
          Home
        </Typography>
        <Typography variant="body1" color="text.primary">
          This is the home page. You can navigate to the Tracking page from the
          top navigation bar.
        </Typography>
      </Paper>
    </Box>
  );
}

export default Home;


