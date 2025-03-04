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
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/verify/:emailToken/:userId", verifyUserEmail);
router.get("/new_access_token", newAccessToken);
router.post("/resend_email_token", resendEmailVerificationToken);
router.post("/reset_password_request", resetPasswordRequest);
router.post("/reset_password", resetPassword);
router.get("/logout", logoutUser);

router.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
  })
);

// $-title   Redirect route to the passport google strategy
// $-path    GET /api/v1/auth/google/redirect
router.get(
  "/google/redirect",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  async (req, res) => {
    const existingUser = await User.findById(req.user.id);
    const payload = {
      id: req.user.id,
      roles: existingUser.roles,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      username: existingUser.username,
      provider: existingUser.provider,
      avatar: existingUser.avatar,
    };
    jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: "20min" },
      (err, token) => {
        const jwt = `${token}`;
        const embedJWT = `
    <html>
    <script>
    window.localStorage.setItem("googleToken",'${jwt}')
    window.location.href='/dashboard'
    </script>

    </html>
    
    `;
        res.send(embedJWT);
      }
    );
  }
);

export default router;
