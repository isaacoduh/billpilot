import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";

// $-title   Get User Profile
// $-path    GET /api/v1/user/profile
// $-auth    Private
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userProfile = await User.findById(userId, {
    refreshToken: 0,
    roles: 0,
    _id: 0,
  });

  if (!userProfile) {
    res.status(404);
    throw new Error("User profile not found!");
  }
  res.status(200).json({ success: true, userProfile });
});

// $-title   Update User Profile
// $-path    PATCH /api/v1/user/profile
// $-auth    Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const {
    password,
    passwordConfirm,
    email,
    isEmailVerified,
    provider,
    roles,
    googleID,
    username,
  } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    res.status(400);
    throw new Error("That user does not exist in our system");
  }

  if (password || passwordConfirm) {
    res.status(400);
    throw new Error(
      "This route is not for password updates. Please use the password reset functionality instead"
    );
  }

  if (email || isEmailVerified || provider || roles || googleID) {
    res.status(400);
    throw new Error("You are not allowed to update that field on this route");
  }

  const fieldsToUpdate = req.body;
  const updatedProfile = await User.findByIdAndUpdate(
    userId,
    { ...fieldsToUpdate },
    { new: true, runValidators: true }
  ).select("-refreshToken");

  res.status(200).json({
    success: true,
    message: `${user.firstName}, your profile was successfully updated!`,
    updatedProfile,
  });
});

// $-title   Delete My Account
// $-path    DELETE /api/v1/user/profile
// $-auth    Private
const deleteMyAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await User.findByIdAndDelete(userId);

  res.json({ success: true, message: "Your user account has been deleted!" });
});

// $-title   Get All Users
// $-path    GET /api/v1/user/all
// $-auth    Private/Admin
const getAllUserAccounts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber);
  const count = await User.countDocuments({});
  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  res.json({
    success: true,
    count,
    numberOfPages: Math.ceil(count / pageSize),
    users,
  });
});

// $-title   Delete User Account
// $-path    DELETE /api/v1/user/:id
// $-auth    Private/Admin
// an admin user can delete any other user account
const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    const result = await user.remove();
    res.json({
      success: true,
      message: `User ${result.firstName} deleted successfully!`,
    });
  } else {
    res.status(404);
    throw new Error("User not found!");
  }
});

// $-title   Deactivate user account
// $-path    PATCH /api/v1/user/:id/deactivate
// $-auth    Private/Admin
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.active = false;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error("user was not found!");
  }
});

export {
  getUserProfile,
  updateUserProfile,
  deleteMyAccount,
  getAllUserAccounts,
  deleteUserAccount,
  deactivateUser,
};
