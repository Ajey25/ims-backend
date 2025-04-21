const express = require("express");
const router = express.Router();
const {
  getStock,
  updateStock,
} = require("../controllers/stockMasterController");

router.get("/", getStock);
router.put("/:id", updateStock);

module.exports = router;
