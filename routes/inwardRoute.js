const express = require("express");
const router = express.Router();
const {
  getInwards,
  addInward,
  updateInward,
  deleteInward,
} = require("../controllers/inwardController");

router.get("/", getInwards);

router.post("/", addInward);

router.put("/:id", updateInward);

router.delete("/:id", deleteInward);

module.exports = router;
