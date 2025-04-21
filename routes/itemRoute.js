const express = require("express");
const router = express.Router();
const {
  getItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  toggleItemStatus,
} = require("../controllers/itemController");

router.get("/", getItems);
router.get("/:id", getItemById);
router.post("/", addItem);
router.put("/:id", updateItem);
router.patch("/:id/toggle-status", toggleItemStatus);
router.delete("/:id", deleteItem);

module.exports = router;
