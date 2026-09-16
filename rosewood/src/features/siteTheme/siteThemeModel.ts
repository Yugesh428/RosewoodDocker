import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../lib/database/sequelize";

// ─── Site Theme (active theme selector - singleton) ──────────────────────────
export interface SiteThemeAttributes {
  id:           number;  // always 1 — singleton row
  activeThemeId: string; // UUID reference to CustomTheme.id OR "gold" / "medical" for defaults
  homeBg:       string;  // "blue" | "white" — homepage background choice
  updatedAt?:   Date;
}

export interface SiteThemeCreationAttributes
  extends Optional<SiteThemeAttributes, "id" | "homeBg" | "updatedAt"> {}

class SiteTheme
  extends Model<SiteThemeAttributes, SiteThemeCreationAttributes>
  implements SiteThemeAttributes
{
  declare id:            number;
  declare activeThemeId: string;
  declare homeBg:        string;
  declare readonly updatedAt?: Date;
}

SiteTheme.init(
  {
    id: {
      type:          DataTypes.INTEGER,
      primaryKey:    true,
      defaultValue:  1,
      allowNull:     false,
    },
    activeThemeId: {
      type:         DataTypes.STRING(100),
      allowNull:    false,
      defaultValue: "gold",
    },
    homeBg: {
      type:         DataTypes.STRING(20),
      allowNull:    false,
      defaultValue: "blue", // "blue" | "white"
    },
    updatedAt: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName:  "SiteTheme",
    tableName:  "site_theme",
    timestamps: false,
  },
);

// ─── Custom Theme (user-created themes) ───────────────────────────────────────
export interface CustomThemeAttributes {
  id:             string;
  name:           string;
  isDefault:      boolean;  // true for "gold" and "medical" (protected, cannot delete)
  
  // Core palette
  primary:        string;
  primaryLight:   string;
  primaryDark:    string;
  primaryText:    string;
  
  // Backgrounds
  bgPage:         string;
  bgGradient:     string;
  bgCard:         string;
  bgNav:          string;
  
  // Text
  textHeading:    string;
  textBody:       string;
  textMuted:      string;
  
  // Borders & shadows
  borderColor:    string;
  shadow:         string;
  shadowHover:    string;
  
  createdAt?:     Date;
  updatedAt?:     Date;
}

export interface CustomThemeCreationAttributes
  extends Optional<CustomThemeAttributes, "id" | "isDefault" | "bgGradient" | "createdAt" | "updatedAt"> {}

export class CustomTheme
  extends Model<CustomThemeAttributes, CustomThemeCreationAttributes>
  implements CustomThemeAttributes
{
  declare id:            string;
  declare name:          string;
  declare isDefault:     boolean;
  
  declare primary:       string;
  declare primaryLight:  string;
  declare primaryDark:   string;
  declare primaryText:   string;
  
  declare bgPage:        string;
  declare bgGradient:    string;
  declare bgCard:        string;
  declare bgNav:         string;
  
  declare textHeading:   string;
  declare textBody:      string;
  declare textMuted:     string;
  
  declare borderColor:   string;
  declare shadow:        string;
  declare shadowHover:   string;
  
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

CustomTheme.init(
  {
    id: {
      type:          DataTypes.STRING(100),  // String to allow "gold"/"medical" + UUIDs
      defaultValue:  DataTypes.UUIDV4,
      primaryKey:    true,
      allowNull:     false,
    },
    name: {
      type:      DataTypes.STRING(100),
      allowNull: false,
      unique:    true,
    },
    isDefault: {
      type:         DataTypes.BOOLEAN,
      allowNull:    false,
      defaultValue: false,
    },
    primary: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    primaryLight: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    primaryDark: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    primaryText: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    bgPage: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    bgGradient: {
      type:         DataTypes.TEXT,
      allowNull:    true,
      defaultValue: null,
    },
    bgCard: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    bgNav: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    textHeading: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    textBody: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    textMuted: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    borderColor: {
      type:      DataTypes.STRING(50),
      allowNull: false,
    },
    shadow: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    shadowHover: {
      type:      DataTypes.STRING(100),
      allowNull: false,
    },
    createdAt: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type:         DataTypes.DATE,
      allowNull:    false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName:    "CustomTheme",
    tableName:    "custom_themes",
    timestamps:   true,
  },
);

export default SiteTheme;
