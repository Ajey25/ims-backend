const StockMaster = require("../models/StockMaster");
const ItemMaster = require("../models/ItemMaster");

exports.getStock = async (req, res) => {
  try {
    const stock = await StockMaster.findAll({
      include: [{ model: ItemMaster, attributes: ["itemName"], as: "item" }],
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { qty, weight } = req.body;

    const stock = await StockMaster.findByPk(req.params.id);
    if (!stock)
      return res.status(404).json({ message: "Stock entry not found" });

    stock.qty = qty;
    stock.weight = weight;
    await stock.save();

    res.json({ message: "Stock updated successfully", stock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
