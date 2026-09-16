import { Sequelize } from "sequelize";

const DATABASE_URL = process.env.DATABASE_URL;

// During `next build`, API routes are statically analyzed but never actually
// executed. We create a placeholder instance so imports don't throw at build
// time. The real connection is established at runtime when DATABASE_URL exists.
const sequelize = new Sequelize(
  DATABASE_URL ?? "postgres://placeholder:placeholder@localhost:5432/placeholder",
  {
    dialect: "postgres",
    dialectOptions: DATABASE_URL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // required for Supabase
          },
        }
      : {},
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    // Force IPv4 to avoid IPv6 connection issues on Render
    dialectModule: require('pg'),
  }
);

// Fail loudly at runtime (not build time) if DATABASE_URL is missing
if (!DATABASE_URL && process.env.NODE_ENV !== "test") {
  console.warn(
    "[sequelize] WARNING: DATABASE_URL is not set. Database calls will fail at runtime."
  );
}

export default sequelize;
