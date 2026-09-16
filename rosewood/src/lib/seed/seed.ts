import bcrypt from "bcryptjs";
import sequelize from "../database/sequelize";
import User from "../models/userModel";

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ DB connected.");
    await sequelize.sync({ alter: true });

    const hashedPassword = await bcrypt.hash("Admin@123", 12);
    console.log("✅ Hash generated:", hashedPassword.substring(0, 20) + "...");

    // Force-update the password regardless of whether admin exists
    const [user, created] = await User.findOrCreate({
      where: { email: "admin@rosewood.com" },
      defaults: {
        name: "Super Admin",
        email: "admin@rosewood.com",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    if (!created) {
      // Already exists — force update the password
      await user.update({ password: hashedPassword });
      console.log("✅ Admin password updated:", user.email);
    } else {
      console.log("✅ Admin created:", user.email);
    }

    // Verify the hash works before exiting
    const verify = await bcrypt.compare("Admin@123", hashedPassword);
    console.log("✅ Hash verification:", verify ? "PASS" : "FAIL");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
