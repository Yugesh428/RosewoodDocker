import { Sequelize } from "sequelize";
import { URL } from "url";

const DATABASE_URL = process.env.DATABASE_URL;

// Parse DATABASE_URL to extract connection details and force IPv4
let sequelizeConfig: any;

if (DATABASE_URL && DATABASE_URL.startsWith("postgres")) {
  try {
    const parsedUrl = new URL(DATABASE_URL);
    
    sequelizeConfig = {
      dialect: "postgres" as const,
      host: parsedUrl.hostname, // Use hostname directly (IPv4)
      port: parseInt(parsedUrl.port) || 5432,
      username: parsedUrl.username,
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.slice(1), // Remove leading /
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    };
  } catch (error) {
    console.error("[sequelize] Failed to parse DATABASE_URL:", error);
    sequelizeConfig = {
      dialect: "postgres" as const,
      host: "localhost",
      port: 5432,
      username: "placeholder",
      password: "placeholder",
      database: "placeholder",
    };
  }
} else {
  sequelizeConfig = {
    dialect: "postgres" as const,
    host: "localhost",
    port: 5432,
    username: "placeholder",
    password: "placeholder",
    database: "placeholder",
  };
}

const sequelize = new Sequelize(sequelizeConfig);

// Fail loudly at runtime (not build time) if DATABASE_URL is missing
if (!DATABASE_URL && process.env.NODE_ENV !== "test") {
  console.warn(
    "[sequelize] WARNING: DATABASE_URL is not set. Database calls will fail at runtime."
  );
}

export default sequelize;
