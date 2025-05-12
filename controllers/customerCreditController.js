const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CustomerCredit = require("../models/CustomerCredits");
const CustomerMaster = require("../models/CustomerMaster");
require("dotenv").config();

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"LogicLoom IT Solution" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📨 Email sent to:", to);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

exports.createCustomerCredit = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;

    const { customerId, paymentType, paymentDate, amount } = req.body;

    if (!customerId || !paymentType || !paymentDate || !amount) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const customer = await CustomerMaster.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const newCredit = await CustomerCredit.create({
      customerId,
      paymentType,
      paymentDate,
      amount,
      createdBy,
    });

    customer.advanceCreditAmount += amount;
    await customer.save();

    const htmlContent = `
      <h3>💰 New Credit Added</h3>
      <p><strong>Customer Name:</strong> ${customer.customerName}</p>
      <p><strong>Customer ID:</strong> ${customer.id}</p>
      <p><strong>Payment Type:</strong> ${paymentType}</p>
      <p><strong>Credit Amount:</strong> ₹${amount}</p>
      <p><strong>Total Credit Balance:</strong> ₹${customer.advanceCreditAmount}</p>
      <hr>
      <small>This is an automated email from LogicLoom IT Solution.</small>
    `;

    await sendEmail({
      to: customer.email,
      subject: "New Credit Added to Your Account",
      html: htmlContent,
    });

    return res.status(201).json({
      message: "Credit added and email sent successfully",
      data: newCredit,
    });
  } catch (error) {
    console.error("Error adding credit:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllCustomerCredits = async (req, res) => {
  try {
    const credits = await CustomerCredit.findAll({
      include: [
        {
          model: CustomerMaster,
          attributes: ["id", "customerName", "email", "mobile"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ data: credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
