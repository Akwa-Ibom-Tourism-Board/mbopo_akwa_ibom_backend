import { User } from "../../auth/User";
import { Application, ApplicationStatus } from "../../applicants/application/Application";

/**
 * Mirrors the frontend registration wizard's own step shape exactly
 * (mbopo_akwa_ibom_design/src/features/mbopo-registration/schema.ts's
 * STEP_FIELDS, plus the identity-verification step that comes before it)
 * — purely for reporting "where did this applicant stop," so Customer
 * Service can follow up. Not validation; a field counts as "filled" if
 * it's simply non-empty, same leniency a draft already has.
 */
export interface RegistrationStep {
  step: number;
  label: string;
  completed: boolean;
  missingFields: string[];
}

export interface RegistrationProgress {
  identityVerified: boolean;
  applicationStarted: boolean;
  applicationStatus: ApplicationStatus | null;
  steps: RegistrationStep[];
  completedSteps: number;
  totalSteps: number;
  // The first step that isn't complete — null once everything (including
  // submission) is done.
  currentStepLabel: string | null;
}

const isFilled = (value: unknown): boolean =>
  typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

function buildSteps(application: Application | null): RegistrationStep[] {
  const get = (field: string) => (application ? application.get(field as any) : null);

  const occupationOk =
    isFilled(get("occupation")) && (get("occupation") !== "Other" || isFilled(get("occupationOther")));
  const institutionOk =
    !isFilled(get("institution")) ||
    get("institution") !== "Other" ||
    isFilled(get("institutionOther"));

  const defs: { label: string; fields: string[]; extraOk?: boolean }[] = [
    {
      label: "Personal information",
      fields: ["phone", "nextOfKin", "nextOfKinPhone", "nextOfKinRelationship"],
    },
    {
      label: "Identity & origin",
      fields: ["village", "localGovernment", "residenceState", "city", "address"],
    },
    {
      label: "Education & background",
      fields: ["education", "talents", "languages"],
      extraOk: occupationOk && institutionOk,
    },
    {
      label: "Pitch (photos & video)",
      fields: ["certificateOfOriginUrl", "fullImageUrl", "fullImageUrl2", "videoPitchUrl"],
    },
    {
      label: "Your story, VIN & declarations",
      fields: ["why", "vin", "declarationIdentity", "declarationAccuracy", "declarationTerms"],
    },
  ];

  return defs.map((def, index) => {
    const missingFields = def.fields.filter((field) => !isFilled(get(field)));
    const completed = missingFields.length === 0 && def.extraOk !== false;
    return { step: index + 1, label: def.label, completed, missingFields };
  });
}

export function buildRegistrationProgress(
  user: User,
  application: Application | null,
): RegistrationProgress {
  const identityVerified = Boolean(user.get("identityVerified"));
  const status = application ? (application.get("status") as ApplicationStatus) : null;
  const steps = buildSteps(application);
  const completedSteps = steps.filter((step) => step.completed).length;

  const currentStepLabel =
    status === ApplicationStatus.Submitted
      ? null
      : (steps.find((step) => !step.completed)?.label ?? null);

  return {
    identityVerified,
    applicationStarted: Boolean(application),
    applicationStatus: status,
    steps,
    completedSteps,
    totalSteps: steps.length,
    currentStepLabel: !identityVerified ? "Identity verification" : currentStepLabel,
  };
}
