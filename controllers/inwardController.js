const ItemMaster = require("../models/ItemMaster");
const { Inward, InwardItem } = require("../models/Inward");
const StockMaster = require("../models/ItemMaster");
const UOM = require("../models/UOM");
const jwt = require("jsonwebtoken");
const sequelize = require("../config/db"); // Import your sequelize instance

const generateInwardNo = async () => {
  const lastInward = await Inward.findOne({ order: [["inwardNo", "DESC"]] });
  return lastInward ? lastInward.inwardNo + 1 : 1000;
};

exports.getInwards = async (req, res) => {
  try {
    const inwards = await Inward.findAll({
      include: [
        {
          model: InwardItem,
          as: "inwardItems",
          include: [
            { model: ItemMaster, as: "itemMaster", attributes: ["itemName"] },
            { model: UOM, as: "UOMDetails", attributes: ["uom"] },
          ],
        },
      ],
    });

    res.json(inwards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addInward = async (req, res) => {
  try {
    const { inwardDate, items, attachment } = req.body;
    const inwardNo = await generateInwardNo();

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;

    let totalInwardAmount = 0;

    // Manually process each item without relying on associations
    const updatedItems = [];
    for (const item of items) {
      const itemId = parseInt(item.itemId);

      // Fetch the item data manually
      const foundItem = await sequelize.query(
        `SELECT itemName FROM itemMaster WHERE id = ?`,
        {
          replacements: [itemId],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!foundItem || foundItem.length === 0) {
        throw new Error(`Item with ID ${itemId} not found`);
      }

      const foundUOM = await sequelize.query(
        `SELECT uom FROM UOMs WHERE id = ?`,
        {
          replacements: [parseInt(item.uom)],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!foundUOM || foundUOM.length === 0) {
        throw new Error(`UOM with ID ${item.uom} not found`);
      }

      const totalAmount =
        foundUOM[0].uom === "qty"
          ? (item.qty || 0) * item.rate
          : (item.weight || 0) * item.rate;

      totalInwardAmount += totalAmount;

      updatedItems.push({
        ...item,
        itemName: foundItem[0].itemName,
        totalAmount,
      });
    }

    // Create the inward record
    const newInward = await Inward.create({
      inwardNo,
      inwardDate,
      totalAmount: totalInwardAmount,
      attachment,
      createdBy,
    });

    // Create inward items
    for (const item of updatedItems) {
      await InwardItem.create({
        inwardId: newInward.id,
        itemId: parseInt(item.itemId),
        itemName: item.itemName,
        uomId: parseInt(item.uom),
        qty: item.qty || 0,
        weight: item.weight || 0,
        rate: item.rate,
        totalAmount: item.totalAmount,
      });
    }

    // Update stock using raw queries to avoid association issues
    for (const item of updatedItems) {
      // Check if stock exists
      const existingStock = await sequelize.query(
        `SELECT id, qty, weight FROM stockMaster WHERE item_id = ?`,
        {
          replacements: [parseInt(item.itemId)],
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (existingStock && existingStock.length > 0) {
        // Update existing stock
        await sequelize.query(
          `UPDATE stockMaster SET 
           qty = qty + ?, 
           weight = weight + ? 
           WHERE id = ?`,
          {
            replacements: [
              parseInt(item.qty) || 0,
              parseFloat(item.weight) || 0,
              existingStock[0].id,
            ],
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      } else {
        // Create new stock
        await sequelize.query(
          `INSERT INTO stockMaster (item_id, qty, weight, createdAt, updatedAt) 
           VALUES (?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              parseInt(item.itemId),
              parseInt(item.qty) || 0,
              parseFloat(item.weight) || 0,
            ],
            type: sequelize.QueryTypes.INSERT,
          }
        );
      }
    }

    res
      .status(201)
      .json({ message: "Inward entry added successfully", inward: newInward });
  } catch (error) {
    console.error("Full error stack:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateInward = async (req, res) => {
  try {
    const { inwardDate, items, attachment } = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const createdBy = decoded.username;

    const inward = await Inward.findByPk(req.params.id);
    if (!inward) {
      return res.status(404).json({ message: "Inward entry not found" });
    }

    const existingItems = await sequelize.query(
      `SELECT itemId, qty, weight FROM InwardItems WHERE inwardId = ?`,
      {
        replacements: [inward.id],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const transaction = await sequelize.transaction();

    try {
      // Reverse previous stock adjustments
      for (const prevItem of existingItems) {
        await sequelize.query(
          `UPDATE stockMaster
           SET qty = qty - ?, weight = weight - ?
           WHERE item_id = ?`,
          {
            replacements: [prevItem.qty, prevItem.weight, prevItem.itemId],
            transaction,
          }
        );
      }

      let totalInwardAmount = 0;
      const updatedItems = [];

      for (const item of items) {
        const itemId = parseInt(item.itemId);

        // Fetch itemName from itemMaster
        const foundItem = await sequelize.query(
          `SELECT itemName FROM itemMaster WHERE id = ?`,
          {
            replacements: [itemId],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        if (!foundItem.length) {
          throw new Error(`Item with ID ${itemId} not found`);
        }

        // Fetch UOM from UOMs table
        const foundUOM = await sequelize.query(
          `SELECT uom FROM UOMs WHERE id = ?`,
          {
            replacements: [parseInt(item.uom)],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        if (!foundUOM.length) {
          throw new Error(`UOM with ID ${item.uom} not found`);
        }

        const totalAmount =
          foundUOM[0].uom === "qty"
            ? (item.qty || 0) * item.rate
            : (item.weight || 0) * item.rate;

        totalInwardAmount += totalAmount;

        updatedItems.push({
          ...item,
          itemName: foundItem[0].itemName,
          totalAmount,
        });
      }

      //  Check for stock sufficiency before updating stockMaster
      for (const item of updatedItems) {
        const itemId = parseInt(item.itemId);

        const stock = await sequelize.query(
          `SELECT qty, weight FROM stockMaster WHERE item_id = ?`,
          {
            replacements: [itemId],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        const availableQty = stock.length ? stock[0].qty : 0;
        const availableWeight = stock.length ? stock[0].weight : 0;

        // Calculate reversed qty and weight from previous entry
        const prevItem = existingItems.find((i) => i.itemId === itemId);
        const prevQty = prevItem ? prevItem.qty : 0;
        const prevWeight = prevItem ? prevItem.weight : 0;

        // Simulate available stock after reversal
        const simulatedQty = availableQty + prevQty;
        const simulatedWeight = availableWeight + prevWeight;

        if ((item.qty || 0) < (prevQty || 0)) {
          const diffQty = prevQty - (item.qty || 0);
          if (diffQty > simulatedQty) {
            throw new Error(
              `Insufficient stock to reduce quantity for item "${item.itemName}". Available qty after reversal: ${simulatedQty}, Required reduction: ${diffQty}`
            );
          }
        }

        if ((item.weight || 0) < (prevWeight || 0)) {
          const diffWeight = prevWeight - (item.weight || 0);
          if (diffWeight > simulatedWeight) {
            throw new Error(
              `Insufficient stock to reduce weight for item "${item.itemName}". Available weight after reversal: ${simulatedWeight}, Required reduction: ${diffWeight}`
            );
          }
        }
      }

      // Update the inward record
      await sequelize.query(
        `UPDATE Inwards
         SET inwardDate = ?, totalAmount = ?, attachment = ?, createdBy = ?, updatedAt = NOW()
         WHERE id = ?`,
        {
          replacements: [
            inwardDate,
            totalInwardAmount,
            attachment,
            createdBy,
            inward.id,
          ],
          transaction,
        }
      );

      // Delete existing inward items
      await sequelize.query(`DELETE FROM InwardItems WHERE inwardId = ?`, {
        replacements: [inward.id],
        transaction,
      });

      // Insert new inward items
      for (const item of updatedItems) {
        await sequelize.query(
          `INSERT INTO inwardItems (inwardId, itemId, itemName, uomId, qty, weight, rate, totalAmount, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          {
            replacements: [
              inward.id,
              parseInt(item.itemId),
              item.itemName,
              parseInt(item.uom),
              item.qty || 0,
              item.weight || 0,
              item.rate,
              item.totalAmount,
            ],
            transaction,
          }
        );
      }

      // Update stock values with new items
      for (const item of updatedItems) {
        const existingStock = await sequelize.query(
          `SELECT id FROM stockMaster WHERE item_id = ?`,
          {
            replacements: [parseInt(item.itemId)],
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        if (existingStock.length) {
          await sequelize.query(
            `UPDATE stockMaster
             SET qty = qty + ?, weight = weight + ?, updatedAt = NOW()
             WHERE item_id = ?`,
            {
              replacements: [
                parseInt(item.qty) || 0,
                parseFloat(item.weight) || 0,
                parseInt(item.itemId),
              ],
              transaction,
            }
          );
        } else {
          await sequelize.query(
            `INSERT INTO stockMaster (item_id, qty, weight, createdAt, updatedAt)
             VALUES (?, ?, ?, NOW(), NOW())`,
            {
              replacements: [
                parseInt(item.itemId),
                parseInt(item.qty) || 0,
                parseFloat(item.weight) || 0,
              ],
              transaction,
            }
          );
        }
      }

      // Commit transaction if everything is successful
      await transaction.commit();

      res.json({ message: "Inward entry updated successfully" });
    } catch (error) {
      // Rollback transaction in case of an error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: error.message });
  }
};
exports.deleteInward = async (req, res) => {
  try {
    const inward = await Inward.findByPk(req.params.id);
    if (!inward)
      return res.status(404).json({ message: "Inward entry not found" });

    const items = JSON.parse(inward.items);

    for (const item of items) {
      let stock = await StockMaster.findOne({
        where: { itemId: item.itemId },
      });
      if (stock) {
        stock.qty -= item.qty || 0;
        stock.weight -= item.weight || 0;
        await stock.save();
      }
    }

    await inward.destroy();
    res.json({ message: "Inward entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
