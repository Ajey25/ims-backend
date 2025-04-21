const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const OnRentReturn = sequelize.define("OnRentReturn", {
  onRentReturnNo: {
    type: DataTypes.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  },
  onRentReturnDate: {
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
  },
  vehicleName: { type: DataTypes.STRING },
  vehicleNo: { type: DataTypes.STRING },
  mobileNo: { type: DataTypes.STRING },
  driverName: { type: DataTypes.STRING },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  paidAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  balanceAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  isReturnCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

const OnRentReturnItem = sequelize.define("OnRentReturnItem", {
  onRentReturnId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "OnRentReturns", // table name, not model name
      key: "onRentReturnNo",
    },
  },
  onRentNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  onRentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  uomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  qtyOrWeight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  qtyReturn: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  perDayRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  usedDays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = { OnRentReturn, OnRentReturnItem };
