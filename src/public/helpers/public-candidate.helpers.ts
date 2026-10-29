import { User } from "../../auth/User";
import { Application, CandidateStage, CandidateJudgingStatus } from "../../applicants/application/Application";
import { senatorialDistrictOf } from "../../configurations/constants";

// Who the public gets to see at all — "gone past LGA Selection" (Q2's
// answer), and still actually in the running: an eliminated/disqualified
// candidate did pass LGA Selection at some point, but showing them on a
// "who's competing" / "who can I vote for" page would be stale and
// confusing, so they drop off here rather than linger with a status badge.
export function isPubliclyVisible(application: Application): boolean {
  const stage = application.get("stage") as CandidateStage | null;
  if (stage === CandidateStage.LgaSelection || !stage) return false;
  const status = application.get("candidateStatus") as CandidateJudgingStatus | null;
  return status !== CandidateJudgingStatus.Eliminated && status !== CandidateJudgingStatus.Disqualified;
}

// Only the Grand Finale is votable (Q2's answer) — and only while the
// candidate is still active there (not already eliminated within it).
export function isVotable(application: Application): boolean {
  return (
    isPubliclyVisible(application) &&
    (application.get("stage") as CandidateStage | null) === CandidateStage.GrandFinale
  );
}

/**
 * The public-safe shape of a candidate: no contact info, no identity
 * documents, no judging scores, no application internals — just what a
 * visitor to the voting site is meant to see. This is the ONLY candidate
 * serializer the public feature uses; admin/helpers/candidate.helpers.ts's
 * serializeCandidateForViewer is a different, staff-only tiering and must
 * never be reused here.
 */
export function serializeCandidateForPublic(user: User, application: Application) {
  const json: any = application.toJSON();
  const userJson: any = user.toJSON();

  const gallery = [json.fullImageUrl, json.fullImageUrl2, ...(json.additionalPhotos ?? [])].filter(
    (url): url is string => Boolean(url),
  );

  return {
    id: json.id,
    name: [userJson.firstName, userJson.lastName].filter(Boolean).join(" "),
    lga: json.localGovernment ?? null,
    senatorialDistrict: senatorialDistrictOf(json.localGovernment),
    stage: json.stage,
    photo: userJson.avatarUrl ?? null,
    gallery,
    videoPitchUrl: json.videoPitchUrl ?? null,
    additionalVideos: json.additionalVideos ?? [],
    bio: json.bio ?? null,
    voteCount: json.voteCount ?? 0,
    votable: isVotable(application),
  };
}
