const express = require("express");
const router = express.Router();
const onRentReturnController = require("../controllers/onRentReturnController");

router.post("/", onRentReturnController.addOnRentReturn);
router.get("/", onRentReturnController.getOnRentReturns);
router.get("/:id", onRentReturnController.getOnRentReturnById);
router.put("/:id", onRentReturnController.updateOnRentReturn);
router.delete("/:id", onRentReturnController.deleteOnRentReturn);

module.exports = router;
