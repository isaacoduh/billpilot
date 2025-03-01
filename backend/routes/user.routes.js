import express from "express";
import checkAuth from "../middleware/checkAuthMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  deleteMyAccount,
  getAllUserAccounts,
  deleteUserAccount,
  deactivateUser,
} from "../controllers/user.controller.js";
import role from "../middleware/roleMiddleware.js";

const router = express.Router();

router
  .route("/profile")
  .get(checkAuth, getUserProfile)
  .patch(checkAuth, updateUserProfile)
  .delete(checkAuth, deleteMyAccount);

router
  .route("/all")
  .get(checkAuth, role.checkRole(role.ROLES.Admin), getAllUserAccounts);
router
  .route("/:id")
  .delete(checkAuth, role.checkRole(role.ROLES.Admin), deleteUserAccount);

router
  .route("/:id/deactivate")
  .delete(checkAuth, role.checkRole(role.ROLES.Admin), deactivateUser);

export default router;
