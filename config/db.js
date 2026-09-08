const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
  },
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.log("Error Connecting Database", err.message);
  });

module.exports = sequelize;
