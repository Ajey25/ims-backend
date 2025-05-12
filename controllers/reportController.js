const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");

const { OnRent } = require("../models/Onrent");
const CustomerMaster = require("../models/CustomerMaster");
const itemMaster = require("../models/ItemMaster");

exports.getReportCustomers = async (req, res) => {
  try {
    const customers = await OnRent.findAll({
      include: [{ model: CustomerMaster, as: "customer" }],
      group: ["customerId"],
    });

    const uniqueCustomers = customers.map((r) => r.CustomerMaster);
    res.json(uniqueCustomers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Error fetching customers" });
  }
};

exports.getCustomerReportData = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await OnRent.findAll({
      where: { customerId: id },
      include: [{ model: itemMaster }],
    });

    const result = data.map((entry) => ({
      itemName: entry.itemMaster?.itemName,
      qty: entry.qty,
      perDayRate: entry.perDayRate,
      amount: entry.amount,
      onRentDate: entry.onRentDate,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching report data:", err);
    res.status(500).json({ error: "Error fetching report data" });
  }
};

exports.sendCustomerReportEmail = async (req, res) => {
  const { customerId, pdfBase64, customerName } = req.body;

  if (!customerId || !pdfBase64) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    // Get customer details
    const customer = await CustomerMaster.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Create temporary folder if it doesn't exist
    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save base64 PDF to a file
    const fileName = `customer-report-${customerId}-${Date.now()}.pdf`;
    const pdfPath = path.join(tempDir, fileName);

    // Extract the base64 data from the data URI
    const base64Data = pdfBase64.split(";base64,").pop();
    fs.writeFileSync(pdfPath, base64Data, { encoding: "base64" });

    // Set up email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email with attachment
    await transporter.sendMail({
      from: "ajay.silentkiller1630@gmail.com",
      to: customer.email,
      subject: "Your Customer Report",
      text: `Dear ${customer.customerName},\n\nPlease find attached your customer report.\n\nRegards,\nLogicLoom IT Solutions`,
      attachments: [{ filename: `${customerName}_report.pdf`, path: pdfPath }],
    });

    // Clean up the temporary file
    fs.unlinkSync(pdfPath);

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Email sending failed:", err);
    res.status(500).json({ error: "Failed to send email: " + err.message });
  }
};
