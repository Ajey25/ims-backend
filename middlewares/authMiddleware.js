//authMiddleware

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Full Authorization Header:", authHeader);

  const token = authHeader?.split(" ")[1];
  console.log("Extracted Token:", token);

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Ajay1234");
    console.log("Decoded Token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token Verification Error:", error.message);
    res.status(401).json({
      message: "Invalid token",
      error: error.message,
    });
  }
};
