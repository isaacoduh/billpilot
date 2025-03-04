import express from "express";
import checkAuth from "../middleware/checkAuthMiddleware.js";
import {
  createDocument,
  deleteDocument,
  getAllUserDocuments,
  getSingleUserDocument,
  updateDocument,
} from "../controllers/document.controller.js";

const router = express.Router();

// create a new document at /api/v1/document/create
router.route("/create").post(checkAuth, createDocument);

// get all of a users documents at /api/v1/document/all
router.route("/all").get(checkAuth, getAllUserDocuments);

// get, update, and delete document at api/v1/document/:id
router
  .route("/:id")
  .patch(checkAuth, updateDocument)
  .get(checkAuth, getSingleUserDocument)
  .delete(checkAuth, deleteDocument);

export default router;
