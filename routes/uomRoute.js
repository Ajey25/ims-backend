const express = require("express");
const router = express.Router();
const {
  getUOMs,
  addUOM,
  updateUOM,
  deleteUOM,
} = require("../controllers/uomController");

router.get("/", getUOMs);
router.post("/", addUOM);
router.put("/:id", updateUOM);
router.delete("/:id", deleteUOM);

module.exports = router;
