const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CustomerMaster = require("../models/CustomerMaster");
const ItemMaster = require("../models/ItemMaster");
const UOM = require("../models/UOM");

const OnRent = sequelize.define("OnRent", {
  onRentNo: {
    type: DataTypes.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  },
  onRentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CustomerMaster,
      key: "id",
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  vehicleName: { type: DataTypes.STRING },
  vehicleNo: { type: DataTypes.STRING },
  mobileNo: { type: DataTypes.STRING },
  driverName: { type: DataTypes.STRING },
});

const OnRentItem = sequelize.define("OnRentItem", {
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ItemMaster,
      key: "id",
    },
  },
  onRentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: OnRent,
      key: "onRentNo",
    },
  },
  itemName: { type: DataTypes.STRING, allowNull: false },
  uomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UOM,
      key: "id",
    },
  },
  qtyOrWeight: { type: DataTypes.FLOAT, allowNull: false },
  perDayRate: { type: DataTypes.FLOAT, allowNull: false },
  onRentReturnDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  qtyReturn: { type: DataTypes.FLOAT, defaultValue: 0 },
  remainingQty: { type: DataTypes.FLOAT, allowNull: false },
  usedDays: { type: DataTypes.INTEGER, defaultValue: 0 },
  amount: { type: DataTypes.FLOAT, defaultValue: 0 },
});

// OnRent.belongsTo(CustomerMaster, { foreignKey: "customerId", as: "customer" });
// OnRentItem.belongsTo(OnRent, { foreignKey: "onRentId" });
// OnRentItem.belongsTo(ItemMaster, { foreignKey: "itemId", as: "item" });
// OnRent.hasMany(OnRentItem, {
//   foreignKey: "onRentId",
//   as: "items",
//   onDelete: "CASCADE",
// });
// OnRentItem.belongsTo(UOM, { foreignKey: "uomId", as: "uom" });

module.exports = { OnRent, OnRentItem };
