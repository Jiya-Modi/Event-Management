const sequelize = require("./db");

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");

    await sequelize.sync();
    console.log("Tables synced successfully");
  } catch (err) {
    console.log("Connection err : ", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
