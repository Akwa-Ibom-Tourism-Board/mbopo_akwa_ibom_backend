import { CandidateStage } from "../../applicants/application/Application";

// Ported verbatim from mbopo_akwa_ibom_admin_frontend's src/lib/phases.ts —
// keep the two in sync by hand. The competition is a fixed sequence of
// "stages of elimination": Local Government → Senatorial → Grand Finale
// Round 1…5 (the Grand Finale is one stage in the selection document,
// split here into its five rounds because each round cuts the field).
export type PhaseId = "lga" | "senatorial" | "gf-r1" | "gf-r2" | "gf-r3" | "gf-r4" | "gf-r5";

export interface PhaseDef {
  id: PhaseId;
  label: string;
  stage: CandidateStage;
  group?: string;
}

export const PHASES: readonly PhaseDef[] = [
  { id: "lga", label: "Local Government", stage: CandidateStage.LgaSelection },
  { id: "senatorial", label: "Senatorial", stage: CandidateStage.SenatorialSelection },
  { id: "gf-r1", label: "Round 1", stage: CandidateStage.GrandFinale, group: "Grand Finale" },
  { id: "gf-r2", label: "Round 2", stage: CandidateStage.GrandFinale, group: "Grand Finale" },
  { id: "gf-r3", label: "Round 3", stage: CandidateStage.GrandFinale, group: "Grand Finale" },
  { id: "gf-r4", label: "Round 4", stage: CandidateStage.GrandFinale, group: "Grand Finale" },
  { id: "gf-r5", label: "Round 5", stage: CandidateStage.GrandFinale, group: "Grand Finale" },
];

export const ALL_PHASE_IDS: readonly PhaseId[] = PHASES.map((p) => p.id);

export const isPhaseId = (value: string | undefined): value is PhaseId =>
  PHASES.some((p) => p.id === value);

export const phaseIndex = (id: PhaseId) => PHASES.findIndex((p) => p.id === id);

export const getPhaseDef = (id: PhaseId): PhaseDef => PHASES[phaseIndex(id)]!;

export const prevPhaseId = (id: PhaseId): PhaseId | undefined =>
  PHASES[phaseIndex(id) - 1]?.id;

export const nextPhaseId = (id: PhaseId): PhaseId | undefined =>
  PHASES[phaseIndex(id) + 1]?.id;

export const stageOfPhase = (id: PhaseId): CandidateStage => getPhaseDef(id).stage;

export const phaseTitle = (id: PhaseId): string => {
  const p = getPhaseDef(id);
  return p.group ? `${p.group} · ${p.label}` : p.label;
};
