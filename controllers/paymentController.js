const { Payment, AllocatedReturn } = require("../models/Payment");
const { OnRentReturn } = require("../models/OnRentReturn");
const CustomerMaster = require("../models/CustomerMaster");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const fs = require("fs");
const e = require("express");
const sendPaymentEmail = async (
  customerEmail,
  customerName,
  paymentDetails,
  mode = "create"
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ajay.silentkiller1630@gmail.com",
        pass: "ffqcugaipniwgypd", // Use App Password
      },
    });
    const formatCurrency = (amount) =>
      `${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
      })}`;
    // Format the date
    const rawDate = paymentDetails?.createdAt;
    const paymentDate = rawDate ? new Date(rawDate) : null;
    const formattedDate = paymentDate
      ? paymentDate.toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    const pdfStream = new PassThrough();

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const subject =
        mode === "update" ? "Payment Update" : "Payment Confirmation";

      const message = `Hi ${customerName},

Please find attached the Payment Invoice for your recent payment.

Payment ID: ${paymentDetails.paymentId}  
Date: ${paymentDetails.paymentDate}  

We truly appreciate your business and look forward to serving you again!

Thank you for choosing LogicLoom IT Solutions.

Best regards,  
Team LogicLoom  
📞 +91-9876543210  
📧 support@logicloom.com`;

      const mailOptions = {
        from: "ajay.silentkiller1630@gmail.com",
        to: customerEmail,
        subject,
        text: message,
        attachments: [
          {
            filename: `Payment_${paymentDetails.paymentId}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ PDF email sent successfully to:", customerEmail);
    });

    // PDF Content
    doc
      .image("assests/LogicLoom-2-04.png", 40, 30, { width: 100 }) // Left corner
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("LogicLoom IT Solutions", 40, 30, {
        align: "right",
        width: 500, // Set full width so align:right works correctly
      })
      .moveDown(1);

    doc
      .moveTo(40, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .stroke();
    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("PAYMENT INVOICE", { align: "center" })
      .moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold");

    const infoLeft = [
      `Payment ID      : ${paymentDetails.id}`,
      `Payment Date  : ${formattedDate}`,
      `Payment Type  : ${paymentDetails.paymentType}`,
    ];

    const infoRight = [
      `Customer Name : ${paymentDetails.customerName}`,
      `Created By          : ${paymentDetails.createdBy}`, // Add Created By
      `Paid Amount       : ${formatCurrency(paymentDetails.paidAmount)}`,
    ];

    const leftX = 40;
    const tableStartY = doc.y;
    const lineHeight = 18;

    // Left side info
    infoLeft.forEach((text, i) => {
      doc.text(text, leftX, tableStartY + i * lineHeight, { width: 400 });
    });

    // Right side info
    infoRight.forEach((text, i) => {
      doc.text(text, 380, tableStartY + i * lineHeight, { width: 250 });
    });

    doc.moveDown(1);
    doc.moveTo(leftX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Table Headers
    const headers = [
      "Sr No.",
      "Allocated Return ID",
      "Status",
      "Allocated Amount",
    ];
    const columnWidths = [50, 250, 100, 100]; // Added width for Status column
    const startY = doc.y;

    doc.fillColor("white").rect(leftX, startY, 500, 20).fill("#0056b3");

    doc.fillColor("white").font("Helvetica-Bold").fontSize(10);
    headers.forEach((header, i) => {
      doc.text(
        header,
        leftX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
        startY + 5,
        { width: columnWidths[i], align: "center" }
      );
    });

    doc.moveDown(1);
    doc.fillColor("black");

    // Table Rows
    let rowY = doc.y;
    paymentDetails.allocatedReturns.forEach((allocation, index) => {
      const rowColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
      doc.fillColor(rowColor).rect(leftX, rowY, 500, 20).fill();
      doc.fillColor("black").font("Helvetica").fontSize(10);

      const rowValues = [
        index + 1,
        allocation.returnId,
        allocation.isReturnCompleted ? "Completed" : "Pending",
        formatCurrency(allocation.allocatedAmount),
      ];

      rowValues.forEach((text, i) => {
        doc
          .fillColor("black")
          .text(
            text.toString(),
            leftX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
            rowY + 5,
            { width: columnWidths[i], align: "center" }
          );
      });

      // Horizontal line between rows
      doc
        .moveTo(leftX, rowY)
        .lineTo(leftX + 500, rowY)
        .strokeColor("#cccccc")
        .stroke();

      rowY += 20;
    });

    // Total Row
    const totalAllocatedAmount = paymentDetails.allocatedReturns.reduce(
      (sum, allocation) => sum + parseFloat(allocation.allocatedAmount || 0),
      0
    );

    doc.fillColor("#e0e0e0").rect(leftX, rowY, 500, 20).fill();
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Total Allocated", leftX + 50 + 250, rowY + 5, {
        width: 100,
        align: "center",
      })
      .text(
        formatCurrency(totalAllocatedAmount),
        leftX + 50 + 250 + 100,
        rowY + 5,
        {
          width: 100,
          align: "center",
        }
      );

    // Footer
    doc.moveDown(2);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text("Thank you for choosing LogicLoom IT Solutions!", {
        align: "center",
      });

    doc.end();
    doc.pipe(pdfStream);
  } catch (error) {
    console.error("❌ Error sending email with PDF:", error);
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: AllocatedReturn,
          as: "allocatedReturns", // This must match the alias you used in `Payment.hasMany()`
        },
      ],
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const returns = await OnRentReturn.findAll({
      include: [
        {
          model: CustomerMaster,
          as: "customers",
          attributes: ["id", "customerName"],
        },
      ],
    });

    const uniqueCustomers = [];
    const customerSet = new Set();

    returns.forEach((ret) => {
      if (ret.customerName && !customerSet.has(ret.customerName.id)) {
        customerSet.add(ret.customerName.id);
        uniqueCustomers.push({
          id: ret.customerName.id,
          customerName: ret.customerName.customerName,
        });
      }
    });

    res.json(uniqueCustomers);
  } catch (error) {
    console.error("Error in getCustomers:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerReturns = async (req, res) => {
  try {
    const { customerId } = req.params;

    const returns = await OnRentReturn.findAll({
      where: {
        customerId: customerId,
        [Op.or]: [{ isReturnCompleted: false }, { isReturnCompleted: null }],
      },
      include: [
        {
          model: CustomerMaster,
          as: "customers",
          attributes: ["id", "customerName"],
        },
      ],
      order: [["onRentReturnDate", "DESC"]],
    });

    if (!returns.length) {
      return res.status(404).json({
        message: "No pending returns found for this customer",
      });
    }
    const formattedReturns = returns.map((ret) => ({
      id: ret.onRentReturnNo,
      returnNumber: ret.onRentReturnNo,
      returnDate: ret.onRentReturnDate,
      totalAmount: ret.totalAmount || 0,
      paidAmount: ret.paidAmount || 0,
      balanceAmount: (ret.totalAmount || 0) - (ret.paidAmount || 0),
      isReturnCompleted: ret.isReturnCompleted || false,
    }));

    res.json(formattedReturns);
  } catch (error) {
    console.error("Error in getCustomerReturns:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;
    const {
      customerId,
      customerName,
      customerEmail, // Add customerEmail here
      paidAmount,
      paymentType,
      allocatedReturns,
    } = req.body;

    if (
      !customerId ||
      !customerName ||
      !paidAmount ||
      !allocatedReturns ||
      !paymentType
    ) {
      return res.status(400).json({
        message:
          "Customer Name, Paid Amount, Payment Type, and Allocated Returns are required",
      });
    }

    const validPaymentTypes = ["Cash", "Cheque", "UPI"];
    if (!validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({
        message: `Invalid payment type. Allowed values are: ${validPaymentTypes.join(
          ", "
        )}`,
      });
    }

    const totalAllocated = allocatedReturns.reduce(
      (sum, ret) => sum + ret.allocatedAmount,
      0
    );
    if (Math.abs(totalAllocated - paidAmount) > 0.01) {
      return res.status(400).json({
        message: "Total allocated amount must equal paid amount",
      });
    }

    for (const allocation of allocatedReturns) {
      const onRentReturn = await OnRentReturn.findOne({
        where: { onRentReturnNo: allocation.returnId },
      });

      if (!onRentReturn) {
        return res.status(404).json({
          message: `OnRentReturn with ID ${allocation.returnId} not found`,
        });
      }

      const availableBalance =
        onRentReturn.totalAmount - (onRentReturn.paidAmount || 0);
      if (allocation.allocatedAmount > availableBalance) {
        return res.status(400).json({
          message: `Allocated amount exceeds available balance for return ${onRentReturn.onRentReturnNo}. Available Balance: ${availableBalance}`,
        });
      }
    }

    const newPayment = await Payment.create(
      {
        customerId,
        customerName,
        paidAmount,
        paymentType,
        allocatedReturns,
        createdBy,
      },
      {
        include: [{ model: AllocatedReturn, as: "allocatedReturns" }],
      }
    );

    // Pass customerEmail to sendPaymentEmail
    await sendPaymentEmail(
      customerEmail,
      customerName,
      newPayment, // You should pass newPayment here for payment details
      "create"
    );
    res.status(201).json({
      message: "Payment recorded successfully",
      payment: newPayment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPaymentTransactions = async (req, res) => {
  try {
    const { customerName } = req.params;

    const payments = await Payment.findAll({
      where: { customerName },
      order: [["createdAt", "DESC"]],
    });

    const returns = await OnRentReturn.findAll({
      where: { customerName },
    });

    const transactions = payments.map((payment) => ({
      ...payment.toJSON(),
      returns: returns.map((ret) => ({
        returnNumber: ret.onRentReturnNo,
        totalAmount: ret.totalAmount,
        balanceAmount: ret.balanceAmount,
        isReturnCompleted: ret.isReturnCompleted,
        allocatedAmount:
          JSON.parse(payment.allocatedReturns || "[]").find(
            (a) => a.returnId.toString() === ret.id.toString()
          )?.allocatedAmount || 0,
      })),
    }));

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await payment.destroy();

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
