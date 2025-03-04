import asyncHandler from "express-async-handler";
import Customer from "../models/customer.model.js";

// $-title   Create Customer
// $-path    POST /api/v1/customer/create
// $-auth    Private
const createCustomer = asyncHandler(async (req, res) => {
  const { email, name, phoneNumber, vatTinNo, address, city, country } =
    req.body;
  if (!email || !name || !phoneNumber) {
    res.status(400);
    throw new Error(
      "A Customer must have at least a name, email and phone number"
    );
  }
  const customerExists = await Customer.findOne({ email });

  if (customerExists) {
    res.status(400);
    throw new Error("That customer already exists");
  }

  const newCustomer = new Customer({
    createdBy: req.user._id,
    name,
    email,
    phoneNumber,
    vatTinNo,
    address,
    city,
    country,
  });
  const createdCustomer = await newCustomer.save();

  if (!createdCustomer) {
    res.status(400);
    throw new Error("Customer could not be created!");
  }

  res.status(200).json({
    success: true,
    message: `Your customer named: ${createdCustomer.name}, was created successfully`,
    createdCustomer,
  });
});

// $-title   Delete Customer
// $-path    DELETE /api/v1/customer/:id
// $-auth    Private
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("That customer does not exist!");
  }

  if (customer.createdBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error(
      "You are not authorized to delete this customer's information. He/She is not your customer!"
    );
  }

  await customer.delete();
  res.json({ success: true, message: "Your customer has been deleted!" });
});

// $-title   Get all customers belonging to a specific User
// $-path    GET /api/v1/customer/all
// $-auth    Private
const getAllUserCustomers = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;
  const count = await Customer.countDocuments({ createdBy: req.user._id });

  const customers = await Customer.find({ createdBy: req.user._id })
    .sort({
      createdAt: -1,
    })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  res.json({
    success: true,
    totalCustomers: count,
    numberOfPages: Math.ceil(count / pageSize),
    myCustomers: customers,
  });
});

// $-title   Get a Single customer belonging to a User
// $-path    GET /api/v1/customer/:id
// $-auth    Private
const getSingleUserCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  const user = req.user._id;

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found!");
  }

  if (customer.id !== user) {
    res.status(200).json({ success: true, customer });
  } else {
    res.status(401);
    throw new Error(
      "You are not authorized to view this customer's information. He/She is not your customer"
    );
  }
});

// $-title   Update Customer
// $-path    PATCH /api/v1/customer/:id
// $-auth    Private
const updateCustomerInfo = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("That Customer does not exist");
  }
  if (customer.createdBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error(
      "You are not authorized to update this customer's information. He/She is not your customer"
    );
  }
  const { id: _id } = req.params;
  const fieldsToUpdate = req.body;

  const updatedCustomerInfo = await Customer.findByIdAndUpdate(
    _id,
    { ...fieldsToUpdate, _id },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `${customer.name}'s info was successfully updated!`,
    updatedCustomerInfo,
  });
});

export {
  createCustomer,
  deleteCustomer,
  getAllUserCustomers,
  getSingleUserCustomer,
  updateCustomerInfo,
};
