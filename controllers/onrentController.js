const { OnRent } = require("../models/Onrent");
const { OnRentItem } = require("../models/Onrent");
const ItemMaster = require("../models/ItemMaster");
const StockMaster = require("../models/StockMaster");
const UOM = require("../models/UOM");
const CustomerMaster = require("../models/CustomerMaster");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const fs = require("fs");
const e = require("express");

const sendOnRentEmail = async (
  customerEmail,
  customerName,
  onRentDetails,
  items,
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

    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    const pdfStream = new PassThrough();

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const subject =
        mode === "update"
          ? "OnRent Booking Updated"
          : "OnRent Booking Confirmation";

      const message = `Hi ${customerName},

Please find attached the OnRent Booking Invoice for your recent order.

OnRent No: ${onRentDetails.onRentNo}  
Date: ${onRentDetails.onRentDate}  

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
            filename: `OnRent_${onRentDetails.onRentNo}.pdf`,
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

    // Draw a line below the header
    doc
      .moveTo(40, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .stroke();
    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("ONRENT BOOKING INVOICE", { align: "center" })
      .moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold");

    const infoLeft = [
      `OnRent No    : ${onRentDetails.onRentNo}`,
      `OnRent Date : ${onRentDetails.onRentDate}`,
    ];

    const infoRight = [
      `Vehicle Name : ${onRentDetails.vehicleName}`,
      `Vehicle No      : ${onRentDetails.vehicleNo}`,
      `Driver Name   : ${onRentDetails.driverName}`,
      `Mobile No       : ${onRentDetails.mobileNo}`,
    ];

    const leftX = 40;
    const tableStartY = doc.y;
    const lineHeight = 18;

    // Left side info
    infoLeft.forEach((text, i) => {
      doc.text(text, leftX, tableStartY + i * lineHeight, { width: 250 });
    });

    // Right side info
    infoRight.forEach((text, i) => {
      doc.text(text, 390, tableStartY + i * lineHeight, { width: 250 });
    });

    doc.moveDown(1);
    doc.moveTo(leftX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Table Headers
    const headers = ["Sr No.", "Item Name", "Qty", "Unit Price "];
    const columnWidths = [50, 250, 100, 100];
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
    items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
      doc.fillColor(rowColor).rect(leftX, rowY, 500, 20).fill();
      doc.fillColor("black").font("Helvetica").fontSize(10);

      const rowValues = [
        index + 1,
        item.itemName,
        item.qtyOrWeight,
        formatCurrency(item.perDayRate),
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
    const total = items.reduce(
      (sum, item) => sum + parseFloat(item.perDayRate || 0),
      0
    );

    doc.fillColor("#e0e0e0").rect(leftX, rowY, 500, 20).fill();
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Total", leftX + 50 + 250, rowY + 5, {
        width: 100,
        align: "center",
      })
      .text(formatCurrency(total), leftX + 50 + 250 + 100, rowY + 5, {
        width: 100,
        align: "center",
      });

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
const generateOnRentNo = async () => {
  try {
    const lastOnRent = await OnRent.findOne({
      order: [["onRentNo", "DESC"]],
    });

    return lastOnRent ? lastOnRent.onRentNo + 1 : 1000;
  } catch (error) {
    console.error("Error generating OnRentNo:", error);
    throw new Error("Failed to generate OnRentNo");
  }
};

exports.getOnRents = async (req, res) => {
  try {
    const onRents = await OnRent.findAll({
      include: [
        {
          model: CustomerMaster,
          as: "customer",
          attributes: ["customerName", "id", "email"],
        },
        {
          model: OnRentItem,
          as: "items",
          // Ensure this matches exactly how you defined the association
          foreignKey: "onRentId",
          include: [
            {
              model: ItemMaster,
              as: "item",
              attributes: ["itemName", "id"],
            },
            {
              model: UOM,
              as: "uom",
              attributes: ["uom"],
            },
          ],
        },
      ],
    });

    res.json(onRents);
  } catch (error) {
    console.error("Error fetching OnRent data:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.addOnRent = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;

    const { onRentDate, customerId, items, vehicleDetails } = req.body;

    const customer = await CustomerMaster.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const onRentNo = await generateOnRentNo();

    // Step 1: Create the OnRent entry
    const newOnRent = await OnRent.create({
      onRentNo,
      onRentDate,
      customerId,
      isActive: true,
      createdBy,
      vehicleName: vehicleDetails?.vehicleName || "",
      vehicleNo: vehicleDetails?.vehicleNo || "",
      mobileNo: vehicleDetails?.mobileNo || "",
      driverName: vehicleDetails?.driverName || "",
    });

    // Step 2: Process each item
    const createdItems = [];

    for (const item of items) {
      const foundItem = await ItemMaster.findByPk(item.item_id);
      if (!foundItem) {
        return res
          .status(404)
          .json({ message: `Item ${item.itemName} not found` });
      }

      const stock = await StockMaster.findOne({
        where: { item_id: item.item_id },
      });

      if (!stock) {
        return res
          .status(400)
          .json({ message: `No stock entry for ${foundItem.itemName}` });
      }

      const uomData = await UOM.findByPk(item.uom);
      if (!uomData) {
        return res.status(400).json({ message: `Invalid UOM selected` });
      }

      const uomType = uomData.uom.toLowerCase();

      if (uomType === "qty" && item.qtyOrWeight > stock.qty) {
        return res.status(400).json({
          message: `Insufficient quantity for ${foundItem.itemName}. Available: ${stock.qty}`,
        });
      }

      if (uomType === "weight" && item.qtyOrWeight > stock.weight) {
        return res.status(400).json({
          message: `Insufficient weight for ${foundItem.itemName}. Available: ${stock.weight}`,
        });
      }

      // Adjust stock
      if (uomType === "qty") {
        stock.qty -= item.qtyOrWeight;
      } else {
        stock.weight -= item.qtyOrWeight;
      }

      await stock.save();

      // Create OnRentItem entry
      const createdItem = await OnRentItem.create({
        onRentId: newOnRent.onRentNo, // Make sure this matches your model definition
        itemId: item.item_id,
        itemName: foundItem.itemName,
        uomId: item.uom,
        qtyOrWeight: item.qtyOrWeight,
        perDayRate: item.perDayRate,
        onRentReturnDate: null,
        qtyReturn: 0,
        remainingQty: item.qtyOrWeight,
        usedDays: 0,
        amount: 0,
      });

      createdItems.push({
        itemId: item.item_id,
        itemName: foundItem.itemName,
        uomId: item.uom,
        qtyOrWeight: item.qtyOrWeight,
        perDayRate: item.perDayRate,
        onRentReturnDate: null,
        qtyReturn: 0,
        remainingQty: item.qtyOrWeight,
        usedDays: 0,
        amount: 0,
      });
    }

    // Optional: Email notification
    await sendOnRentEmail(
      customer.email,
      customer.customerName,
      newOnRent,
      createdItems,
      "create"
    );

    return res.status(201).json({
      message: "OnRent entry created successfully",
      onRent: newOnRent,
      items: createdItems,
    });
  } catch (error) {
    console.error("Error adding OnRent:", error);
    return res.status(500).json({ message: error.message });
  }
};
exports.updateOnRent = async (req, res) => {
  try {
    const { onRentNo } = req.params;
    const updatedData = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    updatedData.createdBy = decoded.username;

    const existingOnRent = await OnRent.findOne({
      where: { onRentNo },
      include: [{ model: OnRentItem, as: "items" }],
    });

    if (!existingOnRent) {
      return res.status(404).json({ message: "OnRent record not found" });
    }

    // Vehicle details
    updatedData.vehicleName =
      updatedData.vehicleDetails?.vehicleName || existingOnRent.vehicleName;
    updatedData.vehicleNo =
      updatedData.vehicleDetails?.vehicleNo || existingOnRent.vehicleNo;
    updatedData.mobileNo =
      updatedData.vehicleDetails?.mobileNo || existingOnRent.mobileNo;
    updatedData.driverName =
      updatedData.vehicleDetails?.driverName || existingOnRent.driverName;
    delete updatedData.vehicleDetails;

    const processedItems = [];

    if (updatedData.items && updatedData.items.length > 0) {
      for (const newItem of updatedData.items) {
        const itemId = newItem.item_id || newItem.itemId;

        const foundItem = await ItemMaster.findByPk(itemId);
        if (!foundItem)
          return res.status(404).json({ message: `Item not found` });

        const stock = await StockMaster.findOne({ where: { item_id: itemId } });
        if (!stock)
          return res.status(400).json({
            message: `Stock entry not found for ${foundItem.itemName}`,
          });

        const uomId = newItem.uomId || newItem.uom;
        const uomData = await UOM.findByPk(uomId);
        if (!uomData)
          return res.status(400).json({ message: `Invalid UOM selected` });

        const uomType = uomData.uom.toLowerCase();

        const existingItem = existingOnRent.items.find(
          (item) => item.dataValues.itemId == itemId
        );

        // If item is found, access properties through dataValues
        const previousQty = existingItem
          ? existingItem.dataValues.qtyOrWeight
          : 0;
        const qtyReturn = existingItem ? existingItem.dataValues.qtyReturn : 0;

        const newQty = newItem.qtyOrWeight;

        // ➕ Add previous quantity back (revert)
        if (uomType === "qty") {
          stock.qty += previousQty - qtyReturn;
        } else {
          stock.weight += previousQty - qtyReturn;
        }

        // ➖ Subtract new quantity
        if (uomType === "qty") {
          if (newQty > stock.qty)
            return res.status(400).json({
              message: `Insufficient quantity for ${foundItem.itemName}. Available: ${stock.qty}`,
            });
          stock.qty -= newQty;
        } else {
          if (newQty > stock.weight)
            return res.status(400).json({
              message: `Insufficient weight for ${foundItem.itemName}. Available: ${stock.weight}`,
            });
          stock.weight -= newQty;
        }

        await stock.save();

        processedItems.push({
          itemId,
          itemName: foundItem.itemName,
          uom: uomType,
          qtyOrWeight: newQty,
          perDayRate: newItem.perDayRate,
          onRentReturnDate: existingItem
            ? existingItem.dataValues.qtyReturn > 0
              ? existingItem.dataValues.onRentReturnDate
              : ""
            : "",
          qtyReturn: qtyReturn,
          remainingQty: newQty - qtyReturn,
          usedDays: existingItem ? existingItem.dataValues.usedDays : 0,
          amount: existingItem ? existingItem.dataValues.amount : 0,
        });
      }

      updatedData.items = processedItems;

      // Update OnRentItem table
      await Promise.all(
        processedItems.map(async (item) => {
          await OnRentItem.update(
            {
              qtyOrWeight: item.qtyOrWeight,
              perDayRate: item.perDayRate,
              remainingQty: item.remainingQty,
              usedDays: item.usedDays,
              amount: item.amount,
            },
            {
              where: {
                onRentId: onRentNo,
                itemId: item.itemId,
              },
            }
          );
        })
      );
    }

    const allItemsReturned =
      updatedData.items?.every(
        (item) => item.qtyReturn > 0 && item.remainingQty === 0
      ) ?? false;

    updatedData.onRentReturnDate = allItemsReturned
      ? new Date()
      : existingOnRent.onRentReturnDate || "";

    updatedData.isActive = !allItemsReturned;

    const [rowsUpdated, updatedRecords] = await OnRent.update(updatedData, {
      where: { onRentNo },
      returning: true,
    });

    if (rowsUpdated === 0) {
      return res.status(404).json({ message: "No records updated" });
    }
    const customer = await CustomerMaster.findByPk(existingOnRent.customerId);

    await sendOnRentEmail(
      customer.email,
      customer.customerName,
      existingOnRent,
      updatedData.items,
      "update"
    );
    res.status(200).json({
      message: "OnRent record updated successfully",
      onRent: updatedRecords[0],
    });
  } catch (error) {
    console.error("Error updating OnRent:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateOnRentReturn = async (
  onRentId,
  returnedItems,
  onRentReturnDate
) => {
  try {
    const onRent = await OnRent.findByPk(onRentId);

    if (!onRent) throw new Error("OnRent entry not found");

    let allReturned = true;
    let updatedItems = [...onRent.items];

    for (const returnedItem of returnedItems) {
      const itemIndex = updatedItems.findIndex(
        (i) => i.item_id.toString() === returnedItem.item_id
      );
      if (itemIndex === -1) continue;

      let item = updatedItems[itemIndex];

      item.qtyReturn += returnedItem.qtyReturn;
      item.remainingQty -= returnedItem.qtyReturn;
      item.onRentReturnDate = onRentReturnDate;

      if (item.remainingQty > 0) {
        allReturned = false;
      }

      item.usedDays = returnedItem.usedDays;
      item.amount = item.perDayRate * item.qtyReturn * item.usedDays;

      const stock = await StockMaster.findOne({
        where: { item_id: returnedItem.item_id },
      });
      if (stock) {
        if (stock.uom === "qty") {
          stock.qty += returnedItem.qtyReturn;
        } else {
          stock.weight += returnedItem.qtyReturn;
        }
        await stock.save();
      }
    }

    onRent.isActive = allReturned ? false : true;

    await OnRent.update({ items: updatedItems }, { where: { id: onRentId } });
  } catch (error) {
    console.error("Error updating OnRent on return:", error.message);
  }
};

exports.toggleOnRentStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const onRent = await OnRent.findByPk(id);
    if (!onRent) {
      return res.status(404).json({ message: "OnRent entry not found" });
    }

    onRent.isActive = !onRent.isActive;
    await onRent.save();

    res.json({ message: "OnRent status updated", isActive: onRent.isActive });
  } catch (error) {
    console.error("Error toggling OnRent status:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteOnRent = async (req, res) => {
  try {
    const { id } = req.params;

    const onRent = await OnRent.findByPk(id, {
      include: [{ model: OnRentItem, as: "items" }],
    });

    if (!onRent) {
      return res.status(404).json({ message: "OnRent entry not found" });
    }

    for (const item of onRent.items) {
      const stock = await StockMaster.findOne({
        where: { item_id: item.item_id },
      });

      if (stock) {
        if (item.uom === "qty") {
          stock.qty += item.qtyOrWeight;
        } else {
          stock.weight += item.qtyOrWeight;
        }
        await stock.save();
      }
    }

    await OnRentItem.destroy({ where: { onRentId: id } });
    await OnRent.destroy({ where: { id } });

    res.json({ message: "OnRent entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting OnRent entry:", error);
    res.status(500).json({ message: error.message });
  }
};
