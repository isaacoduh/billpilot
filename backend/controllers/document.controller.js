import asyncHandler from "express-async-handler";
import Customer from "../models/customer.model.js";
import Document from "../models/document.model.js";

import pdf from "html-pdf";
import path from "path";
import { fileURLToPath } from "url";
import transporter from "../helpers/emailTransport.js";
import emailTemplate from "../utils/pdf/emailTemplate.js";
import options from "../utils/pdf/options.js";
import pdfTemplate from "../utils/pdf/pdfTemplate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filepath = path.join(__dirname, "../../../docs/myDocument.pdf");

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

// $-title   Create new payment
// $-path    POST /api/v1/document/:id/payment
// $-auth    Private
const createDocumentPayment = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  const { datePaid, amountPaid, paymentMethod, additionalInfo } = req.body;

  const payment = {
    paidBy: document.customer.name,
    datePaid,
    amountPaid,
    paymentMethod,
    additionalInfo,
  };
  document.paymentRecords.push(payment);

  await document.save();
  res.status(201).json({
    success: true,
    message: "Payment has been recorded successfully!",
  });
});

// $-title   Generate document
// $-path    POST /api/v1/document/generate-pdf
// $-auth    Public
const generatePDF = async (req, res) => {
  pdf.create(pdfTemplate(req.body), options).toFile("myDocument.pdf", (err) => {
    if (err) {
      res.send(Promise.reject());
    }
    res.send(Promise.resolve());
  });
};

// $-title   Generate document
// $-path    GET /api/v1/document/get-pdf
// $-auth    Public
const getPDF = (req, res) => {
  res.sendFile(filepath);
};

// $-title   send document as email
// $-path    POST /api/v1/document/send-document
// $-auth    Public
const sendDocument = (req, res) => {
  const { profile, document } = req.body;
  pdf.create(pdfTemplate(req.body), options).toFile(filepath, (err) => {
    transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: `${document.customer.email}`,
      replyTo: `${profile.email}`,
      subject: `Document from ${
        profile.businessName ? profile.businessName : profile.firstName
      }`,
      text: `Document from ${
        profile.businessName ? profile.businessName : profile.firstName
      }`,
      html: emailTemplate(req.body),
      attachments: [{ filename: "myDocument.pdf", path: filepath }],
    });
    if (err) {
      res.send(Promise.reject());
    }
    res.send(Promise.resolve());
  });
};

export {
  createDocument,
  deleteDocument,
  getAllUserDocuments,
  getSingleUserDocument,
  updateDocument,
  createDocumentPayment,
  generatePDF,
  getPDF,
  sendDocument,
};
