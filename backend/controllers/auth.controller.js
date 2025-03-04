import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import VerificationToken from "../models/verifyResetToken.model.js";
import sendEmail from "../utils/sendEmail.js";
import { systemLogs } from "../utils/logger.js";
import jwt from "jsonwebtoken";

const domainURL = process.env.DOMAIN;

const { randomBytes } = await import("crypto");

// $-title Register User and send email verification link
// $-path  POST /api/v1/auth/register
// $-auth  Public

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, firstName, lastName, password, passwordConfirm } =
    req.body;
  if (!email) {
    res.status(400);
    throw new Error("An email address is required!");
  }

  if (!username) {
    res.status(400);
    throw new Error("A username is required");
  }
  if (!firstName || !lastName) {
    res.status(400);
    throw new Error("You must enter a full name with a first and last name");
  }

  if (!password) {
    res.status(400);
    throw new Error("You must enter a password");
  }
  if (!passwordConfirm) {
    res.status(400);
    throw new Error("Confirm password field is required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error(
      "The email address you have entered is already associated with another account!"
    );
  }

  try {
    const newUser = new User({
      email,
      username,
      firstName,
      lastName,
      password,
      passwordConfirm,
    });
    const registeredUser = await newUser.save();

    if (!registeredUser) {
      res.status(400);
      throw new Error("User cound not be registered!");
    }

    if (registeredUser) {
      const verificationToken = randomBytes(32).toString("hex");
      let emailVerificationToken = await new VerificationToken({
        _userId: registeredUser._id,
        token: verificationToken,
      }).save();

      const emailLink = `${domainURL}/api/v1/auth/verify/${emailVerificationToken.token}/${registeredUser._id}`;
      const payload = { name: registeredUser.firstName, link: emailLink };
      await sendEmail(
        registeredUser.email,
        "Account Verification",
        payload,
        "./emails/template/accountVerification.handlebars"
      );
      res.json({
        success: true,
        message: `A new user ${await registeredUser.firstName} has been registered!. A verification email has been sent to your account!. Please verify within 15 minutes`,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});

// $-title   Login User, get access and refresh tokens
// $-path    POST /api/v1/auth/login
// $-auth    Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide an email and password");
  }

  const existingUser = await User.findOne({ email }).select("+password");
  if (!existingUser || !(await existingUser.comparePassword(password))) {
    res.status(400);
    systemLogs.error("Incorrect email or password");
    throw new Error("Incorrect email or password");
  }

  if (!existingUser.isEmailVerified) {
    res.status(400);
    throw new Error(
      `Your are not verified. Check your email, verification link was sent when you registered!`
    );
  }

  if (!existingUser.active) {
    res.status(400);
    throw new Error(
      "You have been deactivated by the admin and login is not possible. Please contact support"
    );
  }

  if (existingUser && (await existingUser.comparePassword(password))) {
    const accessToken = jwt.sign(
      { id: existingUser._id, roles: existingUser.roles },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: "10m" }
    );

    const newRefreshToken = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_ACCESS_SECRET_KEY,
      { expiresIn: "1d" }
    );

    const cookies = req.cookies;
    let newRefreshTokenArray = !cookies?.jwt
      ? existingUser.refreshToken
      : existingUser.refreshToken.filter((refT) => refT !== cookies.jwt);

    if (cookies?.jwt) {
      const refreshToken = cookies.jwt;
      const existingRefreshToken = await User.findOne({ refreshToken }).exec();
      if (!existingRefreshToken) {
        newRefreshTokenArray = [];
      }
      const options = {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        secure: true,
        sameSite: "None",
      };
      res.clearCookie("jwt", options);
    }

    existingUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await existingUser.save();

    const options = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "None",
    };
    res.cookie("jwt", newRefreshToken, options);

    res.json({
      success: true,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      username: existingUser.username,
      provider: existingUser.provider,
      avatar: existingUser.avatar,
      accessToken,
    });
  } else {
    res.status(401);
    throw new Error("Invalid Credentials Provided!");
  }
});

// $-title   Verify User Email
// $-path    GET /api/v1/auth/verify/:emailToken/:userId
// $-auth    Public

const verifyUserEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId }).select(
    "-passwordConfirm"
  );
  if (!user) {
    res.status(400);
    throw new Error("We were unable to find a user for this token");
  }
  if (user.isEmailVerified) {
    res.status(400).send("This user has already been verified. Please login");
  }

  const userToken = await VerificationToken.findOne({
    _userId: user._id,
    token: req.params.emailToken,
  });

  if (!userToken) {
    res.status(400);
    throw new Error("Token invalid! Your token may have expired");
  }

  user.isEmailVerified = true;
  await user.save();

  if (user.isEmailVerified) {
    const emailLink = `${domainURL}/login`;
    const payload = { name: user.firstName, link: emailLink };
    await sendEmail(
      user.email,
      "Welcome - Account Verified",
      payload,
      "./emails/templates/welcome.handlebars"
    );
    res.redirect("/auth/verify");
  }
});

// $-title   Get new access tokens from the refresh token
// $-path    GET /api/v1/auth/new_access_token
// $-auth    Public
// we are rotating the refresh tokens, deleting the old ones, creating new ones and detecting token reuse
const newAccessToken = asyncHandler(async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.sendStatus(401);
    }

    const refreshToken = cookies.jwt;
    const options = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "None",
    };
    res.clearCookie("jwt", options);

    const existingUser = await User.findOne({ refreshToken }).exec();

    if (!existingUser) {
      jwt.verify(
        refreshToken,
        process.env.JWT_ACCESS_SECRET_KEY,
        async (err, decoded) => {
          if (err) {
            return res.sendStatus(403);
          }
          const hUser = await User.findOne({ _id: decoded.id }).exec();
          hUser.refreshToken = [];
          await hUser.save();
        }
      );
      return res.sendStatus(403);
    }

    const newRefreshTokenArray = existingUser.refreshToken.filter(
      (refT) => refT !== refreshToken
    );
    jwt.verify(
      refreshToken,
      process.env.JWT_ACCESS_SECRET_KEY,
      async (err, decoded) => {
        if (err) {
          existingUser.refreshToken = [...newRefreshTokenArray];
          await existingUser.save();
        }
        if (err || existingUser._id.toString() !== decoded.id) {
          return res.sendStatus(403);
        }
        const accessToken = jwt.sign(
          { id: existingUser._id, roles: existingUser.roles },
          process.env.JWT_ACCESS_SECRET_KEY,
          { expiresIn: "10m" }
        );
        const newRefreshToken = jwt.sign(
          { id: existingUser._id },
          process.env.JWT_ACCESS_SECRET_KEY,
          { expiresIn: "1d" }
        );
        existingUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
        await existingUser.save();

        const options = {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
          sameSite: "None",
        };

        res.cookie("jwt", newRefreshToken, options);
        res.json({
          success: true,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          username: existingUser.username,
          provider: existingUser.provider,
          avatar: existingUser.avatar,
          accessToken,
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
});

// $-title   Resend Email Verification Tokens
// $-path    POST /api/v1/auth/resend_email_token
// $-auth    Public

const resendEmailVerificationToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!email) {
    res.status(400);
    throw new Error("An email must be provided");
  }

  if (!user) {
    res.status(400);
    throw new Error("We were unable to find a user with that email address");
  }

  if (user.isEmailVerified) {
    res.status(400);
    throw new Error("This account has already been verified. Please login");
  }
  let verificationToken = await VerificationToken.findOne({
    _userId: user._id,
  });
  if (verificationToken) {
    await verificationToken.deleteOne();
  }

  const resentToken = randomBytes(32).toString("hex");
  let emailToken = await new VerificationToken({
    _userId: user._id,
    token: resentToken,
  }).save();

  const emailLink = `${domainURL}/api/v1/auth/verify/${emailToken.token}/${user._id}`;
  const payload = { name: user.firstName, link: emailLink };

  await sendEmail(
    user.email,
    "Account Verification",
    payload,
    "./emails/template/accountVerification.handlebars"
  );

  res.json({
    success: true,
    message: `${user.firstName}, an email has been sent to your account, please verify within 15 minutes`,
  });
});

// $-title   Send password reset email link
// $-path    POST /api/v1/auth/reset_password_request
// $-auth    Public
const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("You must enter your email address");
  }

  const existingUser = await User.findOne({ email }).select("-passwordConfirm");

  if (!existingUser) {
    res.status(400);
    throw new Error("That email is not associated with any account");
  }

  let verificationToken = await VerificationToken.findOne({
    _userId: existingUser._id,
  });

  if (verificationToken) {
    await verificationToken.deleteOne();
  }

  const resetToken = randomBytes(32).toString("hex");

  let newVerificationToken = await new VerificationToken({
    _userId: existingUser._id,
    token: resetToken,
    createdAt: Date.now(),
  }).save();

  if (existingUser && existingUser.isEmailVerified) {
    const emailLink = `${domainURL}/auth/reset_password?emailToken=${newVerificationToken.token}&userId=${existingUser._id}`;
    const payload = { name: existingUser.firstName, link: emailLink };
    await sendEmail(
      existingUser.email,
      "Password Reset Request",
      payload,
      "./emails/template/requestResetPassword.handlebars"
    );
    res.status(200).json({
      success: true,
      message: `Hello ${existingUser.firstName}, an email has been sent to your account with password reset link`,
    });
  }
});

// $-title   Reset User Password
// $-path    POST /api/v1/auth/reset_password
// $-auth    Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password, passwordConfirm, userId, emailToken } = req.body;
  if (!password) {
    res.status(400);
    throw new Error("A password is required");
  }
  if (!passwordConfirm) {
    res.status(400);
    throw new Error("A confirm password field is required");
  }

  if (password !== passwordConfirm) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Passwords must be at least 8 characters long");
  }

  const passwordResetToken = await VerificationToken.findOne({ userId });

  if (!passwordResetToken) {
    res.status(400);
    throw new Error(
      "Your token is either invalid or expired. Try resetting your password again"
    );
  }

  const user = await User.findById({
    _id: passwordResetToken._userId,
  }).select("-passwordConfirm");

  if (user && passwordResetToken) {
    user.password = password;
    await user.save();
    const payload = { name: user.firstName };
    await sendEmail(
      user.email,
      "Password Reset Success",
      payload,
      "./emails/template/resetPassword.handlebars"
    );
    res.json({
      success: true,
      message: `Hey ${user.firstName}, your password reset was successful. An email has been sent to confirm the same`,
    });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    res.sendStatus(204);
    throw new Error("No cookie found!");
  }

  const refreshToken = cookies.jwt;
  const existingUser = await User.findOne({ refreshToken });

  if (!existingUser) {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.sendStatus(204);
  }

  existingUser.refreshToken = existingUser.refreshToken.filter(
    (refT) => refT !== refreshToken
  );

  await existingUser.save();

  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
  res.status(200).json({
    success: true,
    message: `${existingUser.firstName}, you have been logged out successfully`,
  });
});

export {
  registerUser,
  loginUser,
  verifyUserEmail,
  newAccessToken,
  resendEmailVerificationToken,
  resetPasswordRequest,
  resetPassword,
  logoutUser,
};
