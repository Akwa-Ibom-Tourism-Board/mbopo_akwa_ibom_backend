import errorUtilities from "../../../configurations/error-handler";
import responseUtilities from "../../../configurations/response";
import { StatusCodes } from "../../../configurations/statusCodes";
import { Sponsor } from "../Sponsor";
import { assertValidVotingContentUrl } from "../../../configurations/cloudinary";
import { recordActivity } from "../../helpers/activity.helpers";

export interface SponsorInput {
  id?: string;
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
}

const saveSponsorService = errorUtilities.withServiceErrorHandling(
  async (actorId: string, input: SponsorInput) => {
    const id = input.id;
    if (id && input.logoUrl) {
      assertValidVotingContentUrl("sponsor", id, input.logoUrl);
    }

    const existing = id ? await Sponsor.findByPk(id) : null;
    const attrs = {
      name: input.name,
      description: input.description ?? null,
      websiteUrl: input.websiteUrl ?? null,
      logoUrl: input.logoUrl ?? null,
    };

    const sponsor = existing
      ? await existing.update(attrs as any)
      : await Sponsor.create((id ? { id, ...attrs } : attrs) as any);

    await recordActivity(
      actorId,
      "voting",
      `${existing ? "Edited" : "Added"} sponsor ${sponsor.get("name")}`,
    );

    return responseUtilities.handleServicesResponse(
      StatusCodes.OK,
      existing ? "Sponsor updated" : "Sponsor added",
      sponsor,
    );
  },
);

export default saveSponsorService;
