const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ItemMaster = sequelize.define(
  "ItemMaster",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    itemName: { type: DataTypes.STRING, allowNull: false },
    itemCode: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: DataTypes.STRING, allowNull: false },
  },
  {
    tableName: "itemMaster",
    timestamps: true,
  }
);

module.exports = ItemMaster;
