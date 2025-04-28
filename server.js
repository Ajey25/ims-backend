const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/db");

// Import Routes
const stockRoute = require("./routes/stockMasterRoute");
const uomRoute = require("./routes/uomRoute");
const itemRoutes = require("./routes/itemRoute");
const customerRoute = require("./routes/customerRoute");
const inwardRoute = require("./routes/inwardRoute");
const userRoute = require("./routes/userRoute");
const onrentRoute = require("./routes/onrentRoute");
const onrentReturnRoute = require("./routes/onrentreturnRoute");
const paymentRoutes = require("./routes/paymentRoute");
const reportRoutes = require("./routes/reportRoute");
require("./models/association");

dotenv.config();
const app = express();

// CORS Configuration
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://ims-frontend-git-master-ajay-prajapatis-projects-99e0518f.vercel.app",
    "https://ims-frontend-wheat.vercel.app",
  ],
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: "100mb" })); // Increased payload size limit
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// Routes
app.use("/api/stockMaster", stockRoute);
app.use("/api/uom", uomRoute);
app.use("/api/itemMaster", itemRoutes);
app.use("/api/customerMaster", customerRoute);
app.use("/api/inward", inwardRoute);
app.use("/api/userMaster", userRoute);
app.use("/api/onrent", onrentRoute);
app.use("/api/onrentreturn", onrentReturnRoute);
app.use("/api/payment", paymentRoutes);
app.use("/api/report", reportRoutes);

// Function to start the server after DB connection
const startServer = async () => {
  try {
    // Check the database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully!");
    console.log("✅ Database connection pool created successfully!");
    // Sync the models (optional, only needed if you want to auto-sync tables)
    await sequelize.sync({ force: false });

    // Start the server once DB is connected
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1); // Exit process with failure code
  }
};

// Start the server
startServer();
