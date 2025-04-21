const CustomerMaster = require("./CustomerMaster");
const { OnRent, OnRentItem } = require("./Onrent");
const { OnRentReturn, OnRentReturnItem } = require("./OnRentReturn");
const StockMaster = require("./StockMaster");
const ItemMaster = require("./ItemMaster");
const UOM = require("./UOM");

// OnRent associations
OnRent.belongsTo(CustomerMaster, { foreignKey: "customerId", as: "customer" });
OnRentItem.belongsTo(OnRent, { foreignKey: "onRentId", as: "onRent" });
OnRentItem.belongsTo(ItemMaster, { foreignKey: "itemId", as: "item" });
OnRentItem.belongsTo(UOM, { foreignKey: "uomId", as: "uom" });
OnRent.hasMany(OnRentItem, {
  foreignKey: "onRentId",
  as: "items",
  onDelete: "CASCADE",
});

// OnRentReturn associations
OnRentReturn.belongsTo(CustomerMaster, {
  foreignKey: "customerId",
  as: "customers",
});
OnRentReturnItem.belongsTo(OnRentReturn, {
  foreignKey: "onRentReturnId",
  as: "onRentReturn",
});
OnRentReturnItem.belongsTo(ItemMaster, {
  foreignKey: "itemId",
  as: "item",
});
OnRentReturnItem.belongsTo(UOM, {
  foreignKey: "uomId",
  as: "unit",
});
OnRentReturn.hasMany(OnRentReturnItem, {
  foreignKey: "onRentReturnId",
  as: "OnRentReturnItems",
});

// Stock and Item associations
StockMaster.belongsTo(ItemMaster, { foreignKey: "itemId", as: "item" });
ItemMaster.hasOne(StockMaster, { foreignKey: "itemId", as: "stock" });

module.exports = {};
