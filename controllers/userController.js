const UserMaster = require("../models/UserMaster");
const jwt = require("jsonwebtoken");
const md5 = require("md5");

exports.createUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.createdBy = decoded.username;
    req.body.password = md5(req.body.password);

    const newUser = await UserMaster.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await UserMaster.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateUser = async (req, res) => {
  try {
    // Hash password if provided
    if (req.body.password && req.body.password.trim() !== "") {
      req.body.password = md5(req.body.password);
    }

    // Extract and verify token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body.createdBy = decoded.username || decoded.userId;

    // Update user
    const [updatedRowCount] = await UserMaster.update(req.body, {
      where: { id: parseInt(req.params.id, 10) },
    });

    if (updatedRowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch updated user
    const updatedUser = await UserMaster.findOne({
      where: { id: parseInt(req.params.id, 10) },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await UserMaster.destroy({
      where: { id: req.params.id },
    });
    if (deletedUser === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserMaster.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = md5(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.firstName },
      process.env.JWT_SECRET || "Ajay1234",
      { expiresIn: "6h" }
    );
    console.log(token);

    const { password: _, ...userDetails } = user.toJSON();

    return res.status(200).json({
      token,
      user: userDetails,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
