import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../../lib/database/sequelize";

/**
 * HeroSlide — stores hero carousel slides for the public home page.
 *
 * imageUrl: local path (/uploads/hero/xxx.jpg) for now, S3 URL later.
 * title:    main heading text overlay on the image.
 * subtitle: supporting text/description.
 * order:    sort order (lower = shown first).
 * isActive: false = hidden from public.
 *
 * Note: CTA buttons are hardcoded by developers, not client-editable.
 */
class HeroSlide extends Model<
  InferAttributes<HeroSlide>,
  InferCreationAttributes<HeroSlide>
> {
  declare id: CreationOptional<string>;
  declare imageUrl: string;
  declare title: CreationOptional<string | null>;
  declare subtitle: CreationOptional<string | null>;
  declare order: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

HeroSlide.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    subtitle: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "hero_slides",
    timestamps: true,
    freezeTableName: true,
    indexes: [{ fields: ["order"] }, { fields: ["isActive"] }],
  },
);

export default HeroSlide;
