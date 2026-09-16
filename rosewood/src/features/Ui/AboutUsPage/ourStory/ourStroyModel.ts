import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

/**
 * OurStory — content for the "Our Story" section on the About Us page.
 *
 * UI structure:
 *  - imageUrl   → left-side photo (optional, falls back to static image)
 *  - title      → section heading  e.g. "Born from a Desire to Redefine the Pharmacy"
 *  - paragraph1 → origin story paragraph
 *  - paragraph2 → decade of dedication paragraph
 *  - paragraph3 → team/belief statement paragraph
 *
 * Single-row table — only one record ever exists (upsert pattern).
 */
class OurStory extends Model<
  InferAttributes<OurStory>,
  InferCreationAttributes<OurStory>
> {
  declare id: CreationOptional<string>;
  declare imageUrl: CreationOptional<string | null>;
  declare title: string;
  declare paragraph1: string;
  declare paragraph2: CreationOptional<string | null>;
  declare paragraph3: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

OurStory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: null,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: "Title is required" } },
    },
    paragraph1: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: { msg: "paragraph1 is required" } },
    },
    paragraph2: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    paragraph3: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "our_story",
    timestamps: true,
    freezeTableName: true,
  },
);

export default OurStory;
