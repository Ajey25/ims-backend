const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const ItemMaster = require("./ItemMaster");
const UOM = require("./UOM");

const Inward = sequelize.define(
  "Inward",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inwardNo: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    inwardDate: { type: DataTypes.DATE, allowNull: false },
    createdBy: { type: DataTypes.STRING, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    attachment: { type: DataTypes.TEXT("long"), allowNull: true },
  },
  { timestamps: true }
);

const InwardItem = sequelize.define(
  "InwardItem",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inwardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Inward, key: "id" },
    },
    itemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ItemMaster, key: "id" },
    },
    itemName: { type: DataTypes.STRING, allowNull: false },
    uomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: UOM, key: "id" },
    },
    qty: { type: DataTypes.INTEGER, defaultValue: 0 },
    weight: { type: DataTypes.FLOAT, defaultValue: 0 },
    rate: { type: DataTypes.FLOAT, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  },
  { timestamps: true }
);

Inward.hasMany(InwardItem, { foreignKey: "inwardId", as: "inwardItems" });
InwardItem.belongsTo(Inward, { foreignKey: "inwardId" });

ItemMaster.hasMany(InwardItem, { foreignKey: "itemId", as: "itemMaster" });
InwardItem.belongsTo(ItemMaster, { foreignKey: "itemId", as: "itemMaster" });

UOM.hasMany(InwardItem, { foreignKey: "uomId", as: "inwardItems" });
InwardItem.belongsTo(UOM, { foreignKey: "uomId", as: "UOMDetails" });

ItemMaster.belongsToMany(Inward, {
  through: InwardItem,
  foreignKey: "itemId",
  as: "inwards",
});
Inward.belongsToMany(ItemMaster, {
  through: InwardItem,
  foreignKey: "inwardId",
  as: "items",
});

module.exports = { Inward, InwardItem };
