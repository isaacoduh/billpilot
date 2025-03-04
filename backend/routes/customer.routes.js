import express from "express";

import {
  createCustomer,
  deleteCustomer,
  getAllUserCustomers,
  getSingleUserCustomer,
  updateCustomerInfo,
} from "../controllers/customer.controller.js";
import checkAuth from "../middleware/checkAuthMiddleware.js";

const router = express.Router();

router.route("/create").post(checkAuth, createCustomer);

// get all the users customers at /api/v1/customer/all
router.route("/all").get(checkAuth, getAllUserCustomers);

// get, update and delete a customer
router
  .route("/:id")
  .get(checkAuth, getSingleUserCustomer)
  .patch(checkAuth, updateCustomerInfo)
  .delete(checkAuth, deleteCustomer);

export default router;
