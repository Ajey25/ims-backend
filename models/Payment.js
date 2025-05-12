const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const { OnRentReturn } = require("./OnRentReturn");
const CustomerMaster = require("./CustomerMaster");
const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.ENUM("Cash", "Cheque", "UPI", "Credits"),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

const AllocatedReturn = sequelize.define("AllocatedReturn", {
  returnNumber: {
    type: DataTypes.INTEGER,
  },
  allocatedAmount: {
    type: DataTypes.FLOAT,
  },
  isReturnCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Payment.hasMany(AllocatedReturn, { as: "allocatedReturns" });
AllocatedReturn.belongsTo(Payment);

AllocatedReturn.belongsTo(OnRentReturn, { foreignKey: "returnId" });
Payment.belongsTo(CustomerMaster, {
  foreignKey: "customerId",
  as: "customers",
});

Payment.afterCreate(async (payment, options) => {
  try {
    for (const allocation of payment.allocatedReturns) {
      const onRentReturn = await OnRentReturn.findByPk(allocation.returnId);
      if (onRentReturn) {
        onRentReturn.paidAmount =
          (onRentReturn.paidAmount || 0) + allocation.allocatedAmount;
        onRentReturn.balanceAmount =
          onRentReturn.totalAmount - onRentReturn.paidAmount;
        onRentReturn.isReturnCompleted = onRentReturn.balanceAmount === 0;

        await onRentReturn.save();
      }
    }
  } catch (error) {
    console.error("Error updating OnRentReturn:", error);
  }
});

module.exports = { Payment, AllocatedReturn };
