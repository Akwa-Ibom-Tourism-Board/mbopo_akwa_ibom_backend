import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { NewsPost } from "../NewsPost";
import { assertValidVotingContentUrl } from "../../../configurations/cloudinary";
import { recordActivity } from "../../helpers/activity.helpers";

export interface NewsInput {
  id?: string;
  title: string;
  summary: string;
  body: string[];
  coverImageUrl?: string | null;
  images?: string[];
  videoUrls?: string[];
  publishedAt?: string;
}

// Create (no id, or an id the table doesn't have yet — see the shared
// client-generated-id note in configurations/cloudinary.ts) or update.
const saveNewsService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, input: NewsInput) => {
    const id = input.id;
    const imageUrls = [input.coverImageUrl, ...(input.images ?? [])].filter(
      (url): url is string => Boolean(url),
    );
    if (id) {
      for (const url of imageUrls) assertValidVotingContentUrl("news", id, url);
    }

    const existing = id ? await NewsPost.findByPk(id) : null;

    const attrs = {
      title: input.title,
      summary: input.summary,
      body: input.body,
      coverImageUrl: input.coverImageUrl ?? null,
      images: input.images ?? [],
      videoUrls: input.videoUrls ?? [],
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date(),
    };

    const post = existing
      ? await existing.update(attrs as any)
      : await NewsPost.create((id ? { id, ...attrs } : attrs) as any);

    await recordActivity(
      actorId,
      "voting",
      `${existing ? "Edited" : "Published"} picture news post "${post.get("title")}"`,
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      existing ? "News post updated" : "News post published",
      post,
    );
  },
);

export default saveNewsService;
