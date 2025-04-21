const express = require("express");
const router = express.Router();
const userMasterController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/login", userMasterController.loginUser);
router.post("/", authMiddleware, userMasterController.createUser);
router.get("/", authMiddleware, userMasterController.getUsers);
router.put("/:id", authMiddleware, userMasterController.updateUser);
router.delete("/:id", authMiddleware, userMasterController.deleteUser);

module.exports = router;
