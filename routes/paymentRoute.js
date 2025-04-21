const express = require("express");
const router = express.Router();
const {
  getPayments,
  getCustomers,
  getCustomerReturns,
  addPayment,
  getPaymentTransactions,
  deletePayment,
} = require("../controllers/paymentController");

router.get("/", getPayments);

router.get("/customers", getCustomers);

router.get("/customer-returns/:customerId", getCustomerReturns);

router.get("/transactions/:customerId", getPaymentTransactions);

router.post("/", addPayment);

router.delete("/:id", deletePayment);

module.exports = router;
