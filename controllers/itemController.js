const ItemMaster = require("../models/ItemMaster");
const jwt = require("jsonwebtoken");

exports.getItems = async (req, res) => {
  try {
    const items = await ItemMaster.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await ItemMaster.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addItem = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.body.createdBy = decoded.username;

  const { itemName, itemCode, description, isActive } = req.body;

  try {
    const newItem = await ItemMaster.create({
      itemName,
      itemCode,
      description,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: decoded.username,
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.createdBy = decoded.username;

    const { itemName, itemCode, description, isActive } = req.body;

    const item = await ItemMaster.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.update({
      itemName,
      itemCode,
      description,
      isActive,
      createdBy: decoded.username,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleItemStatus = async (req, res) => {
  try {
    const item = await ItemMaster.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.isActive = !item.isActive;
    await item.save();

    res.json({
      message: `Item ${item.isActive ? "activated" : "deactivated"}`,
      item,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const rowsDeleted = await ItemMaster.destroy({
      where: { id: req.params.id },
    });

    if (!rowsDeleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
