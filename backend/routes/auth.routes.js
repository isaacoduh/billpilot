import express from "express";
import {
  loginUser,
  registerUser,
  verifyUserEmail,
  newAccessToken,
  resendEmailVerificationToken,
  resetPassword,
  resetPasswordRequest,
  logoutUser,
} from "../controllers/auth.controller.js";
import { loginLimiter } from "../middleware/apiLimiter.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/verify/:emailToken/:userId", verifyUserEmail);
router.get("/new_access_token", newAccessToken);
router.post("/resend_email_token", resendEmailVerificationToken);
router.post("/reset_password_request", resetPasswordRequest);
router.post("/reset_password", resetPassword);
router.get("/logout", logoutUser);

export default router;
