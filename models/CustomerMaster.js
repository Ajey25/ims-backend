const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerMaster = sequelize.define(
  "CustomerMaster",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    mobile: { type: DataTypes.STRING, allowNull: false },
    gst: { type: DataTypes.STRING },
    pan: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    advanceCreditAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    createdBy: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "customerMaster",
    timestamps: true,
  }
);

module.exports = CustomerMaster;
