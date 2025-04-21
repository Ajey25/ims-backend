const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UOM = sequelize.define(
  "UOM",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    uom: { type: DataTypes.STRING, allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { timestamps: true }
);

module.exports = UOM;
