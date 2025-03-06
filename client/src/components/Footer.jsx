import { Box, CssBaseline, Link, Typography } from "@mui/material";

import { FaMoneyBillWave } from "react-icons/fa";

function Copyright() {
  return (
    <Typography variant="body2" align="center" sx={{ color: "#ffffff" }}>
      {"Copyright"}
      <Link color="inherit" href="https://github.com/isaacoduh">
        Bill Pilot
      </Link>
      {new Date().getFullYear()} {"."}
    </Typography>
  );
}

const Footer = () => {
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        width: "100%",
        bgcolor: "#000000",
        marginTop: "auto",
      }}
      className="footer"
    >
      <CssBaseline />
      <Box
        component="footer"
        sx={{ py: 1, px: 1, mt: "auto", bgColor: "#000000" }}
      >
        <Typography
          variant="subtitle1"
          align="center"
          component="p"
          sx={{ color: "#07f011" }}
        >
          <FaMoneyBillWave />
          <FaMoneyBillWave />
        </Typography>
        <Copyright />
      </Box>
    </Box>
  );
};

export default Footer;
