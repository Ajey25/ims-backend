const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const CustomerMaster = require("./CustomerMaster");

const CustomerCredit = sequelize.define(
  "CustomerCredit",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CustomerMaster,
        key: "id",
      },
    },
    paymentType: {
      type: DataTypes.ENUM("cash", "cheque", "UPI"),
      allowNull: false,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "customerCredit",
    timestamps: true,
  }
);

CustomerMaster.hasMany(CustomerCredit, { foreignKey: "customerId" });
CustomerCredit.belongsTo(CustomerMaster, { foreignKey: "customerId" });

CustomerCredit.afterCreate(async (credit, options) => {
  const customer = await CustomerMaster.findByPk(credit.customerId);
  if (customer) {
    customer.advanceCreditAmount += credit.amount;
    await customer.save();
  }
});

module.exports = CustomerCredit;
