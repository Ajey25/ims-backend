const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");
router.use((req, res, next) => {
  // console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

router.get("/", customerController.getCustomers);
router.get("/check/email", customerController.checkEmailExists);

router.get("/:id", customerController.getCustomerById);

router.post("/", customerController.addCustomer);

router.put("/:id", customerController.updateCustomer);

router.patch("/:id/toggle", customerController.toggleCustomerStatus);

router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
