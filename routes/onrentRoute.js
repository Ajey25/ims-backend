const express = require("express");
const router = express.Router();
const {
  getOnRents,
  addOnRent,
  updateOnRent,
  toggleOnRentStatus,
  deleteOnRent,
} = require("../controllers/onrentController");

router.get("/", getOnRents);

router.post("/", addOnRent);

router.put("/:onRentNo", updateOnRent);

router.patch("/toggle/:id", toggleOnRentStatus);

router.delete("/:id", deleteOnRent);

module.exports = router;
