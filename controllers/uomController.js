const UOM = require("../models/UOM");

exports.getUOMs = async (req, res) => {
  try {
    const uoms = await UOM.findAll();
    res.json(uoms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addUOM = async (req, res) => {
  try {
    const { uom } = req.body;

    const existingUOM = await UOM.findOne({ where: { uom } });
    if (existingUOM) {
      return res.status(400).json({ message: "UOM already exists" });
    }

    const newUOM = await UOM.create({ uom });
    res.status(201).json({ message: "UOM added successfully", uom: newUOM });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUOM = async (req, res) => {
  try {
    const { isActive } = req.body;

    const uom = await UOM.findByPk(req.params.id);
    if (!uom) return res.status(404).json({ message: "UOM not found" });

    uom.isActive = isActive;
    await uom.save();

    res.json({ message: "UOM updated successfully", uom });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUOM = async (req, res) => {
  try {
    const uom = await UOM.findByPk(req.params.id);
    if (!uom) return res.status(404).json({ message: "UOM not found" });

    await uom.destroy();
    res.json({ message: "UOM deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
