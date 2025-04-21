const { OnRent, OnRentItem } = require("../models/Onrent");
const { OnRentReturn, OnRentReturnItem } = require("../models/OnRentReturn");
const StockMaster = require("../models/StockMaster.js");
const CustomerMaster = require("../models/CustomerMaster");
const ItemMaster = require("../models/ItemMaster.js");
const UOM = require("../models/UOM");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sequelize = require("../config/db");
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");

const sendEmail = async (toEmail, onRentReturn, items, mode = "create") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ajay.silentkiller1630@gmail.com",
        pass: "ffqcugaipniwgypd", // App password
      },
    });

    const formatCurrency = (amount) =>
      `${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
      })}`;

    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
    const pdfStream = new PassThrough();
    const leftX = 40;

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const subject =
        mode === "update"
          ? "OnRentReturn Booking Updated"
          : "OnRentReturn Booking Confirmation";

      // ✅ FIX: define message BEFORE using it
      const message = `
Please find attached the OnRent Return Invoice.

OnRent Return No: ${onRentReturn.onRentReturnNo}
Date: ${onRentReturn.onRentReturnDate}

Thank you for choosing LogicLoom IT Solutions!

Best regards,
Team LogicLoom
📞 +91-9876543210
📧 support@logicloom.com`;

      const mailOptions = {
        from: "ajay.silentkiller1630@gmail.com",
        to: toEmail,
        subject,
        text: message,
        attachments: [
          {
            filename: `OnRent_Return_${onRentReturn.onRentReturnNo}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Return PDF sent to:", toEmail);
    });

    // ===== PDF DESIGN (unchanged) =====

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
      .text("ONRENT RETURN INVOICE", { align: "center" })
      .moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold");
    const infoLeft = [
      `Return No     : ${onRentReturn.onRentReturnNo}`,
      `Return Date  : ${onRentReturn.onRentReturnDate}`,
    ];

    const infoRight = [
      `Vehicle Name : ${onRentReturn.vehicleName}`,
      `Vehicle No      : ${onRentReturn.vehicleNo}`,
      `Driver Name   : ${onRentReturn.driverName}`,
      `Mobile No       : ${onRentReturn.mobileNo}`,
    ];

    const tableStartY = doc.y;
    const lineHeight = 18;

    infoLeft.forEach((text, i) => {
      doc.text(text, leftX, tableStartY + i * lineHeight, { width: 250 });
    });

    infoRight.forEach((text, i) => {
      doc.text(text, 390, tableStartY + i * lineHeight, { width: 250 }); // shifted right
    });

    doc.moveDown(1);
    doc.moveDown(1);
    doc.moveTo(leftX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // ===== Table =====
    const headers = [
      "Sr No.",
      "Item Name",
      "Return Qty",
      "Days Used",
      "Per Day Rate ",
      "Amount",
    ];
    const columnWidths = [50, 150, 60, 60, 90, 90];
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

    let rowY = doc.y;
    let totalAmount = 0;

    items.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? "#f2f2f2" : "#ffffff";
      doc.fillColor(rowColor).rect(leftX, rowY, 500, 20).fill();
      doc.fillColor("black").font("Helvetica").fontSize(10);

      const returnQty = Number(item.qtyReturn || 0);
      const daysUsed = Number(item.usedDays || 0);
      const perDayRate = Number(item.perDayRate || 0);
      const amount = returnQty * daysUsed * perDayRate;
      totalAmount += amount;

      const rowValues = [
        index + 1,
        item.itemName,
        returnQty,
        daysUsed,
        formatCurrency(perDayRate),
        formatCurrency(amount),
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

      doc
        .moveTo(leftX, rowY)
        .lineTo(leftX + 500, rowY)
        .strokeColor("#cccccc")
        .stroke();
      rowY += 20;
    });

    // ===== Total Row =====
    doc.fillColor("#e0e0e0").rect(leftX, rowY, 500, 20).fill();
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Total", leftX + 50 + 150 + 60 + 60, rowY + 5, {
        width: 90,
        align: "center",
      })
      .text(
        formatCurrency(totalAmount),
        leftX + 50 + 150 + 60 + 60 + 90,
        rowY + 5,
        {
          width: 90,
          align: "center",
        }
      );

    // ===== Footer =====
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
    console.error("❌ Error sending return PDF email:", error);
  }
};

const generateOnRentReturnNo = async () => {
  const lastReturn = await OnRentReturn.findOne({
    order: [["onRentReturnNo", "DESC"]],
  });
  return lastReturn ? lastReturn.onRentReturnNo + 1 : 5000;
};

exports.addOnRentReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;

    const { onRentReturnDate, customerName, items, vehicleDetails } = req.body;
    const onRentReturnNo = await generateOnRentReturnNo();
    const customer = await CustomerMaster.findByPk(customerName, {
      transaction,
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customerEmail = customer.email;
    let updatedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.qtyReturn) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: `qtyReturn is required for ${item.itemName}` });
      }

      const onRentRecord = await OnRent.findByPk(item.onRentNo, {
        include: [
          {
            model: OnRentItem,
            as: "items",
            where: { itemId: item.itemId },
            required: false,
          },
        ],
        transaction,
      });

      if (!onRentRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: "OnRent record not found" });
      }

      const rentedItem = onRentRecord.items.find(
        (i) => i.itemId === item.itemId
      );
      if (!rentedItem) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Item ${item.itemName} not found in OnRent record`,
        });
      }

      const usedDays = Math.ceil(
        (new Date(onRentReturnDate) - new Date(onRentRecord.onRentDate)) /
          (1000 * 60 * 60 * 24)
      );

      const amount =
        Number(item.qtyReturn) * Number(rentedItem.perDayRate) * usedDays;

      if (Number(item.qtyReturn) > rentedItem.remainingQty) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot return more than rented qty for ${rentedItem.itemName}. Remaining Quantity: ${rentedItem.remainingQty}`,
        });
      }

      rentedItem.remainingQty -= Number(item.qtyReturn);
      rentedItem.qtyReturn += Number(item.qtyReturn);
      rentedItem.usedDays = usedDays;
      rentedItem.amount += amount;
      rentedItem.isCompleted = rentedItem.remainingQty === 0;
      rentedItem.onRentReturnDate = onRentReturnDate;
      await rentedItem.save({ transaction });

      const stock = await StockMaster.findOne({
        where: { item_id: item.itemId },
        transaction,
      });

      if (stock) {
        stock.qty = (Number(stock.qty) || 0) + Number(item.qtyReturn);
        await stock.save({ transaction });
      } else {
        await StockMaster.create(
          {
            itemId: item.itemId,
            qty: Number(item.qtyReturn),
          },
          { transaction }
        );
      }

      // Determine isActive based on qty match
      const isActive = Number(item.qtyOrWeight) !== Number(item.qtyReturn);

      // Prepare item for child table insertion
      updatedItems.push({
        onRentNo: item.onRentNo,
        onRentDate: onRentRecord.onRentDate,
        itemId: item.itemId,
        itemName: item.itemName,
        uomId: item.uom || item.uomId,
        qtyOrWeight: item.qtyOrWeight,
        qtyReturn: Number(item.qtyReturn),
        perDayRate: rentedItem.perDayRate,
        usedDays,
        amount,
        isActive, // ✅ Add isActive to each item
      });

      totalAmount += amount;
    }

    // Save parent record
    const newOnRentReturn = await OnRentReturn.create(
      {
        onRentReturnNo,
        onRentReturnDate,
        customerId: customerName,
        vehicleName: vehicleDetails?.vehicleName,
        vehicleNo: vehicleDetails?.vehicleNo,
        mobileNo: vehicleDetails?.mobileNo,
        driverName: vehicleDetails?.driverName,
        totalAmount,
        createdBy,
        items: updatedItems,
      },
      { transaction }
    );

    // Insert into OnRentReturnItems table
    for (const item of updatedItems) {
      await OnRentReturnItem.create(
        {
          onRentReturnId: newOnRentReturn.onRentReturnNo,
          onRentNo: item.onRentNo,
          onRentDate: item.onRentDate,
          itemId: item.itemId,
          itemName: item.itemName,
          uomId: item.uomId,
          qtyOrWeight: item.qtyOrWeight,
          qtyReturn: item.qtyReturn,
          perDayRate: item.perDayRate,
          usedDays: item.usedDays,
          amount: item.amount,
          isActive: item.isActive, // ✅ Store isActive here
        },
        { transaction }
      );
    }

    await transaction.commit();

    await sendEmail(customerEmail, newOnRentReturn, updatedItems, "create");

    res.status(201).json({
      message: "OnRent Return entry added successfully",
      onRentReturn: {
        ...newOnRentReturn.toJSON(),
        items: updatedItems,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in addOnRentReturn:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOnRentReturns = async (req, res) => {
  try {
    const onRentReturns = await OnRentReturn.findAll({
      include: [
        {
          model: CustomerMaster,
          as: "customers",
          attributes: ["customerName", "email"],
        },
        {
          model: OnRentReturnItem,
          as: "OnRentReturnItems",
          attributes: {},
        },
      ],
    });

    // Parse JSON items field for each return
    const formattedReturns = onRentReturns.map((orr) => {
      const plainOrr = orr.get({ plain: true });
      try {
        plainOrr.items = JSON.parse(plainOrr.items);
      } catch (error) {
        plainOrr.items = [];
      }
      return plainOrr;
    });

    res.json(formattedReturns);
  } catch (error) {
    console.error("Error in getOnRentReturns:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getOnRentReturnById = async (req, res) => {
  try {
    const onRentReturn = await OnRentReturn.findOne({
      where: { onRentReturnNo: req.params.id },
      include: [
        {
          model: CustomerMaster,
          as: "customers",
          attributes: ["customerName", "email"],
        },
      ],
    });

    if (!onRentReturn) {
      return res.status(404).json({ message: "OnRent Return entry not found" });
    }

    // Parse JSON items field
    const plainReturn = onRentReturn.get({ plain: true });
    try {
      plainReturn.items = JSON.parse(plainReturn.items);
    } catch (error) {
      plainReturn.items = [];
    }

    res.json(plainReturn);
  } catch (error) {
    console.error("Error in getOnRentReturnById:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.updateOnRentReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const updatedBy = decoded.username;

    const { onRentReturnDate, customerName, items, vehicleDetails } = req.body;
    const onRentReturnNo = req.params.id;

    const onRentReturn = await OnRentReturn.findByPk(onRentReturnNo, {
      transaction,
    });

    if (!onRentReturn) {
      await transaction.rollback();
      return res.status(404).json({ message: "OnRent Return entry not found" });
    }

    const customer = await CustomerMaster.findByPk(customerName, {
      transaction,
    });
    if (!customer) {
      await transaction.rollback();
      return res.status(404).json({ message: "Customer not found" });
    }
    const customerEmail = customer.email;

    // Get previous return items
    const previousReturnItems = await OnRentReturnItem.findAll({
      where: { onRentReturnId: onRentReturnNo },
      transaction,
    });

    // Initialize a map to track net changes to stock by itemId
    const stockAdjustments = {};

    // Calculate stock adjustments (difference between new and old return quantities)
    for (const newItem of items) {
      // Find the previous item with the same itemId
      const prevItem = previousReturnItems.find(
        (item) =>
          item.itemId === newItem.itemId && item.onRentNo === newItem.onRentNo
      );

      // Calculate the net change for this item
      const prevQty = prevItem ? Number(prevItem.qtyReturn) : 0;
      const newQty = Number(newItem.qtyReturn);
      const netChange = newQty - prevQty;

      // Add to the total adjustment for this itemId
      if (!stockAdjustments[newItem.itemId]) {
        stockAdjustments[newItem.itemId] = 0;
      }
      stockAdjustments[newItem.itemId] += netChange;
    }

    // Handle items that were previously returned but are not in the new items list
    for (const prevItem of previousReturnItems) {
      const stillExists = items.some(
        (item) =>
          item.itemId === prevItem.itemId && item.onRentNo === prevItem.onRentNo
      );

      if (!stillExists) {
        if (!stockAdjustments[prevItem.itemId]) {
          stockAdjustments[prevItem.itemId] = 0;
        }
        // Removing this item completely means reducing stock by its full amount
        stockAdjustments[prevItem.itemId] -= Number(prevItem.qtyReturn);
      }
    }

    // Validate that stock levels won't go negative
    for (const itemId in stockAdjustments) {
      const adjustment = stockAdjustments[itemId];

      const stock = await StockMaster.findOne({
        where: { item_id: itemId },
        transaction,
      });

      if (!stock && adjustment < 0) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot update return - no stock record found for item ID ${itemId}`,
        });
      }

      if (stock && Number(stock.qty) + adjustment < 0) {
        // Find the item name
        const itemName =
          previousReturnItems.find((item) => item.itemId == itemId)?.itemName ||
          items.find((item) => item.itemId == itemId)?.itemName ||
          `Item ID ${itemId}`;

        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot update return - insufficient stock for ${itemName}. Current stock: ${
            stock.qty
          }, Required adjustment: ${-adjustment}`,
        });
      }
    }

    // Now update the OnRent records and handle remaining/return quantities
    // First, reset the OnRent records to their original state
    for (const prevItem of previousReturnItems) {
      const onRentRecord = await OnRent.findByPk(prevItem.onRentNo, {
        include: [
          {
            model: OnRentItem,
            as: "items",
            where: { itemId: prevItem.itemId },
            required: false,
          },
        ],
        transaction,
      });

      if (!onRentRecord || !onRentRecord.items.length) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Original OnRent record or item not found for item ID ${prevItem.itemId}`,
        });
      }

      const rentedItem = onRentRecord.items[0];

      // Reset the rentedItem to its state before this return was recorded
      rentedItem.remainingQty += Number(prevItem.qtyReturn);
      rentedItem.qtyReturn -= Number(prevItem.qtyReturn);
      rentedItem.amount -= Number(prevItem.amount);
      rentedItem.usedDays = 0;
      rentedItem.isCompleted = false;
      rentedItem.isActive = true;

      await rentedItem.save({ transaction });
    }

    // Delete previous return items
    await OnRentReturnItem.destroy({
      where: { onRentReturnId: onRentReturnNo },
      transaction,
    });

    let updatedItems = [];
    let totalAmount = 0;

    // Process all new return items
    for (const item of items) {
      const onRentRecord = await OnRent.findByPk(item.onRentNo, {
        include: [
          {
            model: OnRentItem,
            as: "items",
            where: { itemId: item.itemId },
            required: false,
          },
        ],
        transaction,
      });

      if (!onRentRecord) {
        await transaction.rollback();
        return res.status(404).json({ message: "OnRent record not found" });
      }

      const rentedItem = onRentRecord.items.find(
        (i) => i.itemId === item.itemId
      );

      if (!rentedItem) {
        await transaction.rollback();
        return res.status(404).json({
          message: `Item ${item.itemName} not found in OnRent record`,
        });
      }

      if (Number(item.qtyReturn) > rentedItem.remainingQty) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot return more than rented qty for ${item.itemName}. Remaining Quantity: ${rentedItem.remainingQty}`,
        });
      }

      const usedDays = Math.ceil(
        (new Date(onRentReturnDate) - new Date(onRentRecord.onRentDate)) /
          (1000 * 60 * 60 * 24)
      );

      const amount =
        Number(item.qtyReturn) * Number(rentedItem.perDayRate) * usedDays;
      totalAmount += amount;

      // Update rented item with the return amount
      rentedItem.remainingQty -= Number(item.qtyReturn);
      rentedItem.qtyReturn += Number(item.qtyReturn);
      rentedItem.usedDays = usedDays;
      rentedItem.amount += amount;
      rentedItem.isCompleted = rentedItem.remainingQty === 0;
      rentedItem.onRentReturnDate = onRentReturnDate;
      rentedItem.isActive = rentedItem.remainingQty > 0 ? true : false;

      await rentedItem.save({ transaction });

      // Create return item record
      await OnRentReturnItem.create(
        {
          onRentReturnId: onRentReturnNo,
          onRentNo: item.onRentNo,
          onRentDate: onRentRecord.onRentDate,
          itemId: item.itemId,
          itemName: item.itemName,
          uomId: item.uom || item.uomId,
          qtyOrWeight: item.qtyOrWeight,
          qtyReturn: Number(item.qtyReturn),
          perDayRate: rentedItem.perDayRate,
          usedDays,
          amount,
        },
        { transaction }
      );

      updatedItems.push({
        onRentNo: item.onRentNo,
        onRentDate: onRentRecord.onRentDate,
        itemId: item.itemId,
        itemName: item.itemName,
        uomId: item.uom || item.uomId,
        qtyOrWeight: item.qtyOrWeight,
        qtyReturn: Number(item.qtyReturn),
        perDayRate: rentedItem.perDayRate,
        usedDays,
        amount,
      });
    }

    // Now apply all stock adjustments in one pass
    for (const itemId in stockAdjustments) {
      const adjustment = stockAdjustments[itemId];

      // Skip if no adjustment needed
      if (adjustment === 0) continue;

      const stock = await StockMaster.findOne({
        where: { item_id: itemId },
        transaction,
      });

      if (stock) {
        // Apply the adjustment
        stock.qty = Number(stock.qty) + adjustment;
        await stock.save({ transaction });
      } else if (adjustment > 0) {
        // Create new stock record if it doesn't exist (only for positive adjustments)
        await StockMaster.create(
          {
            item_id: itemId,
            qty: adjustment,
            weight: 0,
          },
          { transaction }
        );
      }
    }

    // Update main return record
    onRentReturn.onRentReturnDate = onRentReturnDate;
    onRentReturn.customerId = customerName;
    onRentReturn.vehicleName = vehicleDetails?.vehicleName;
    onRentReturn.vehicleNo = vehicleDetails?.vehicleNo;
    onRentReturn.driverName = vehicleDetails?.driverName;
    onRentReturn.mobileNo = vehicleDetails?.mobileNo;
    onRentReturn.totalAmount = totalAmount;
    onRentReturn.updatedBy = updatedBy;

    await onRentReturn.save({ transaction });
    await transaction.commit();

    try {
      await sendEmail(customerEmail, onRentReturn, updatedItems, "update");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    res.status(200).json({
      message: "OnRentReturn record updated successfully",
    });
  } catch (error) {
    console.error("Update Error:", error);
    await transaction.rollback();
    res.status(500).json({ message: "Failed to save on rent return", error });
  }
};
exports.deleteOnRentReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const onRentReturn = await OnRentReturn.findByPk(req.params.id, {
      transaction,
    });

    if (!onRentReturn) {
      await transaction.rollback();
      return res.status(404).json({ message: "OnRent Return entry not found" });
    }

    // Parse items JSON
    let returnItems = [];
    try {
      returnItems = JSON.parse(onRentReturn.items);
    } catch (error) {
      returnItems = [];
    }

    // Revert changes for each item
    for (const item of returnItems) {
      const onRentRecord = await OnRent.findByPk(item.onRentNo, {
        include: [
          {
            model: OnRentItem,
            as: "items",
            where: { itemId: item.itemId },
            required: false,
          },
        ],
        transaction,
      });

      if (!onRentRecord) continue;

      const rentedItem = onRentRecord.items.find(
        (i) => i.itemId === item.itemId
      );

      if (rentedItem) {
        // Revert quantities
        rentedItem.remainingQty += Number(item.qtyReturn);
        rentedItem.qtyReturn -= Number(item.qtyReturn);
        rentedItem.isCompleted = false;
        await rentedItem.save({ transaction });
      }

      // Update stock
      const stock = await StockMaster.findOne({
        where: { itemId: item.itemId },
        transaction,
      });

      if (stock) {
        stock.qty -= Number(item.qtyReturn); // Reduce stock by returned quantity
        await stock.save({ transaction });
      }
    }

    // Delete OnRentReturn entry
    await onRentReturn.destroy({ transaction });

    // Commit transaction
    await transaction.commit();

    res.json({ message: "OnRent Return entry deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message });
  }
};
