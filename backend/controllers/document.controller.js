import asyncHandler from "express-async-handler";
import Customer from "../models/customer.model.js";
import Document from "../models/document.model.js";

// $-title   Create Document
// $-path    POST /api/v1/document/create
// $-auth    Private

const createDocument = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ createdBy: req.user._id });
  if (!customer) {
    res.status(404);
    throw new Error(
      "That customer does not exist for the currently logged in user"
    );
  }

  if (customer.createdBy.toString() !== req.user._id.toString()) {
    res.status(400);
    throw new Error(
      "You are not allowed to create documents for customers who you did not create"
    );
  }

  const fieldsToCreate = req.body;

  const newDocument = new Document({
    createdBy: req.user._id,
    ...fieldsToCreate,
  });

  const createdDocument = await newDocument.save();
  if (!createdDocument) {
    res.status(400);
    throw new Error("The document could not be created!");
  }

  res.status(200).json({ success: true, newDocument });
});

// $-title   Delete Document
// $-path    DELETE /api/v1/document/:id
// $-auth    Private
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error("That document does not exist!");
  }

  if (document.createdBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error(
      "You are not authorized to delete this document. It's not yours"
    );
  }

  await document.delete();

  res.json({ success: true, message: "Your document has been deleted" });
});

// $-title   Get all documents belonging to a specific User
// $-path    GET /api/v1/document/all
// $-auth    Private
const getAllUserDocuments = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.page) || 1;

  const count = await Document.countDocuments({ createdBy: req.user._id });

  const documents = await Document.find({ createdBy: req.user._id })
    .sort({
      createdAt: -1,
    })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .lean();

  res.json({
    success: true,
    totalDocuments: count,
    numberOfPages: Math.ceil(count / pageSize),
    myDocuments: documents,
  });
});

// $-title   Get a Single Document belonging to a User
// $-path    GET /api/v1/document/:id
// $-auth    Private
const getSingleUserDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  const user = req.user._id;

  if (!document) {
    res.status(204);
    throw new Error("document not found");
  }

  if (document.id !== user) {
    res.status(200).json({
      success: true,
      document,
    });
  } else {
    res.status(401);
    throw new Error(
      "You are not authorized to view this document. It's not yours"
    );
  }
});

// $-title   Update Document
// $-path    PATCH /api/v1/document/:id
// $-auth    Private
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    res.status(404);
    throw new Error("That document does not exist");
  }

  if (document.createdBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error(
      "You are not authorized to update this document. It's not yours"
    );
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `Your ${updatedDocument.documentType}'s info was updated successfully`,
    updatedDocument,
  });
});

export {
  createDocument,
  deleteDocument,
  getAllUserDocuments,
  getSingleUserDocument,
  updateDocument,
};
