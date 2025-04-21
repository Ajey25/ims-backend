const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ItemMaster = require("./ItemMaster");

const StockMaster = sequelize.define(
  "StockMaster",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ItemMaster,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
  },
  {
    timestamps: true,
    tableName: "stockMaster",
  }
);

// StockMaster.belongsTo(ItemMaster, { foreignKey: "item_id", as: "item" });
// ItemMaster.hasOne(StockMaster, { foreignKey: "item_id", as: "stock" });

module.exports = StockMaster;
