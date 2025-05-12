const express = require("express");
const router = express.Router();
const customerCreditController = require("../controllers/customerCreditController");

router.post("/add", customerCreditController.createCustomerCredit);
router.get("/all", customerCreditController.getAllCustomerCredits);

module.exports = router;
