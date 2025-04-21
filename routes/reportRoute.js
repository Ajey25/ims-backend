const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/customers", reportController.getReportCustomers);
router.get("/customer/:id", reportController.getCustomerReportData);
router.post("/send-report", reportController.sendCustomerReportEmail);

module.exports = router;
