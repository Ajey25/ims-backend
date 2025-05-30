const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Railway's port is 56327 but fallback helps
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false, // This is the default for most MySQL clients
      },
    },
    logging: false,
  }
);

module.exports = sequelize;

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully!!");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

module.exports = sequelize;
