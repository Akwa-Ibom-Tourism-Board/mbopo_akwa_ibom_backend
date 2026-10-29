import { DataTypes, Model } from "sequelize";
import { database } from "../../configurations/database";

export interface NewsPostAttributes {
  id: string;
  title: string;
  summary: string;
  body: string[];
  coverImageUrl?: string | null;
  coverImagePublicId?: string | null;
  images?: string[];
  videoUrls?: string[];
  publishedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NewsPost extends Model<NewsPostAttributes> {}

NewsPost.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: false },
    body: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    coverImageUrl: { type: DataTypes.TEXT, allowNull: true },
    coverImagePublicId: { type: DataTypes.TEXT, allowNull: true },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    videoUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    publishedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize: database,
    tableName: "NewsPost",
    timestamps: true,
  },
);

export default NewsPost;
