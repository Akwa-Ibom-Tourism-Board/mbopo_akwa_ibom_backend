import { CandidateStage } from "../../applicants/application/Application";
import type { PhaseId } from "./phases.config";

// Ported verbatim from mbopo_akwa_ibom_admin_frontend's
// src/features/judging/data/mock-stages.ts — keep the two in sync by hand.
// Seeded from the selection-process document ("1ST SELECTION PROCESS"):
// stages, rounds, criteria and question banks are transcribed from it. Only
// spelling/grammar slips in the source were corrected (noted inline there).
// Where the document gives no criteria for a round, the nearest stated set
// is used and `criteriaNote` says so — confirm these with the organisers.

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

export interface Round {
  id: string;
  stage: CandidateStage;
  code: string; // "A", "B", … as lettered in the selection document
  name: string;
  durationSeconds?: number;
  thinkSeconds?: [number, number];
  prompt?: string;
  guidance?: string;
  criteria: string[];
  criteriaNote?: string;
  questionBank?: { questions: string[]; expectedCount: number };
  causes?: string[];
}

export interface StageConfig {
  id: CandidateStage;
  order: number;
  name: string;
  summary: string;
  advanceTarget: { count: number; label: string };
  rounds: Round[];
}

const CORE = ["Confidence", "Speech", "Personality", "Composure", "Clarity"];
const KNOWLEDGE = ["Knowledge", "Reasoning", "Composure", "Communication"];

const stage1: Round[] = [
  {
    id: "s1-intro",
    stage: CandidateStage.LgaSelection,
    code: "A",
    name: "Introduction",
    durationSeconds: 30,
    prompt:
      "Please introduce yourself to the judges. Tell us your name, what you do, where you are from and one thing that makes you unique.",
    criteria: CORE,
  },
  {
    id: "s1-written",
    stage: CandidateStage.LgaSelection,
    code: "W",
    name: "Written examination",
    guidance: "Tests intelligence and IQ. Enter the marked result on the 1–10 scale.",
    criteria: ["Examination score"],
    criteriaNote:
      "The document lists the written exam but gives no breakdown — modelled as a single 1–10 score. Confirm how exam marks map onto the scale.",
  },
];

const stage2: Round[] = [
  {
    id: "s2-walk",
    stage: CandidateStage.SenatorialSelection,
    code: "B",
    name: "Walk & Presentation",
    durationSeconds: 60,
    prompt: "Candidate enters, walks across the stage, turns and exits.",
    criteria: ["Posture", "Poise", "Elegance", "Confidence", "Body coordination", "Stage awareness"],
  },
  {
    id: "s2-quick",
    stage: CandidateStage.SenatorialSelection,
    code: "C",
    name: "Quick Question",
    durationSeconds: 60,
    prompt: "Each candidate is given one question.",
    criteria: CORE,
    criteriaNote:
      "The document gives no criteria for this round — scored on the same core criteria as the Introduction.",
    questionBank: {
      expectedCount: 10,
      questions: [
        "What does beauty mean to you?",
        "What is one problem affecting young people today?",
        "If you won the crown today, what would you use your platform to promote?",
        "Who is a woman you admire and why?",
        "What makes a good leader?",
        "What is one thing you would change in your community?",
        "What does being a modern Akwa Ibom woman mean to you?",
        "What is more important in leadership: intelligence or empathy? Why?",
        "5 min written question and answer exercise",
        "What does being “Mbopo Akwa Ibom” mean to you?",
      ],
    },
  },
];

const stage3: Round[] = [
  {
    id: "s3-r1",
    stage: CandidateStage.GrandFinale,
    code: "R1",
    name: "Round 1 — General Knowledge & Personality",
    guidance:
      "Designed to quickly separate candidates who are prepared from those who are not. Candidates will not necessarily be eliminated because they don't know a factual answer — judges consider knowledge, reasoning, composure and communication.",
    criteria: KNOWLEDGE,
    questionBank: {
      expectedCount: 10,
      questions: [
        "What is the capital of Akwa Ibom State?",
        "Who is the current President of Nigeria?",
        "What is one major tourism attraction in your state?",
        "What does leadership mean to you?",
        "What is one quality you believe every young woman should develop?",
        "What is the difference between confidence and arrogance?",
        "What does integrity mean?",
        "If you could meet one woman in history, who would it be and why?",
        "What is one issue affecting young people that deserves more attention?",
        "What does \"beauty with purpose\" mean to you?",
      ],
    },
  },
  {
    id: "s3-r2",
    stage: CandidateStage.GrandFinale,
    code: "R2",
    name: "Round 2 — Intelligence & Critical Thinking",
    thinkSeconds: [30, 60],
    guidance:
      "Identifies candidates who can think under pressure. Give the candidate 30–60 seconds to think before she answers.",
    criteria: KNOWLEDGE,
    criteriaNote: "The document gives no criteria for this round — scored on the same four as Round 1.",
    questionBank: {
      expectedCount: 10,
      questions: [
        "If you had ₦10 million to improve your community, how would you spend it?",
        "If social media disappeared tomorrow, how would you continue promoting your cause?",
        "Which is more important for Akwa Ibom's development: Tourism, Education or infrastructure? Defend your position.",
        "If you became governor for one day, what is the first thing you would change?",
        "A young person tells you that there are no opportunities in Akwa Ibom. What would you tell them?",
        "If you disagree with someone who is older and more powerful than you, how would you handle the situation?",
        "What is the biggest misconception about beauty pageants?",
        "Can a person be beautiful without being attractive? Explain.",
        "Should celebrities and public figures be expected to speak on social issues?",
        "What is one thing Akwa Ibom should learn from another growing city or state, nationally or internationally?",
      ],
    },
  },
  {
    id: "s3-r3",
    stage: CandidateStage.GrandFinale,
    code: "R3",
    name: "Round 3 — Pressure Questions",
    guidance:
      "For eliminating candidates who struggle under pressure. The objective is not to embarrass contestants, but to test their composure.",
    criteria: [
      "Avoids panic",
      "Avoids defensiveness",
      "Eye contact",
      "Answers the actual question",
      "Independent thinking",
      "Respectfulness",
    ],
    questionBank: {
      expectedCount: 8,
      questions: [
        "You have 30 seconds. Convince us that you deserve this crown.",
        "What makes you different from the other contestants?",
        "Why should we choose you instead of the contestant standing next to you?",
        "What is your greatest weakness?",
        "Tell us something about yourself that your application doesn't reveal.",
        "What would you do if you disagreed with the pageant organizers?",
        "If you don't win tonight, what will you do tomorrow?",
        "What is one criticism you have received that was difficult to accept?",
      ],
    },
  },
  {
    id: "s3-r4",
    stage: CandidateStage.GrandFinale,
    code: "R4",
    name: "Round 4 — Culture & Heritage",
    guidance: "Candidates are asked any of the questions in the bank.",
    criteria: KNOWLEDGE,
    criteriaNote: "The document gives no criteria for this round — scored on the same four as Round 1.",
    questionBank: {
      expectedCount: 13,
      questions: [
        "What are three things Akwa Ibom State is famous for?",
        "What traditional value should young people preserve?",
        "Name a traditional dish from your Local Government and explain its significance.",
        "What cultural practice do you think should be preserved?",
        "How can tourism help preserve culture?",
        "How would you introduce your culture to an international audience?",
        "What does your cultural identity mean to you?",
        "What would you tell a foreign visitor visiting your state for the first time?",
        "How can young people use social media to promote indigenous culture?",
        "Why is cultural preservation important in a modern society?",
        "Indicate two significant things your Local Government Chairman has done to improve living in your Local Government.",
        "Mention all sub-themes under the ARISE Agenda.",
        "What is the name of your Paramount Ruler?",
      ],
    },
  },
  {
    id: "s3-r5",
    stage: CandidateStage.GrandFinale,
    code: "R5",
    name: "Round 5 — Advocacy / Beauty With Purpose",
    durationSeconds: 120,
    prompt:
      "If crowned, what cause would you champion, why does it matter and what practical action would you take?",
    guidance:
      "Every finalist identifies a cause or social issue she intends to champion during her reign, then gives a 2-minute presentation. This is the last round — the cut leaves one winner.",
    criteria: CORE,
    criteriaNote:
      "The document gives no criteria for this round — scored on the same base criteria as the Introduction.",
    causes: [
      "Girl-child education",
      "Tourism",
      "Mental wellness",
      "Entrepreneurship",
      "Environmental protection",
      "Domestic violence awareness",
      "Skills development",
      "Youth empowerment",
      "Cultural preservation",
      "Disability inclusion",
      "Literacy",
      "Community development",
    ],
  },
];

export const STAGES: StageConfig[] = [
  {
    id: CandidateStage.LgaSelection,
    order: 1,
    name: "Local Government Selections",
    summary:
      "Preliminary audition — a short, high-volume elimination round of about 3–5 minutes per contestant. Three candidates are selected per LGA.",
    advanceTarget: { count: 93, label: "3 per LGA × 31 LGAs" },
    rounds: stage1,
  },
  {
    id: CandidateStage.SenatorialSelection,
    order: 2,
    name: "Senatorial District Selections",
    summary:
      "Auditions by senatorial district: Walk & Presentation, then a Quick Question. One candidate per LGA advances.",
    advanceTarget: { count: 31, label: "1 per LGA" },
    rounds: stage2,
  },
  {
    id: CandidateStage.GrandFinale,
    order: 3,
    name: "Grand Finale",
    summary:
      "Five elimination rounds. Questions get progressively harder, and the judges cut the field at the end of each round until one winner remains.",
    advanceTarget: { count: 1, label: "1 winner" },
    rounds: stage3,
  },
];

export const getStageConfig = (id: CandidateStage): StageConfig => STAGES.find((s) => s.id === id)!;

export const ALL_ROUNDS = STAGES.flatMap((s) => s.rounds);

// The rounds judged in each stage of elimination. Local Government and
// Senatorial score every round together (the stage total decides the cut);
// each Grand Finale round is a stage of its own.
export function roundsOf(phase: PhaseId): Round[] {
  if (phase === "lga") return STAGES[0]!.rounds;
  if (phase === "senatorial") return STAGES[1]!.rounds;
  const id = `s3-${phase.slice(3)}`; // "gf-r2" -> "s3-r2"
  return STAGES[2]!.rounds.filter((r) => r.id === id);
}

export function phaseOfRound(roundId: string): PhaseId | undefined {
  if (roundId.startsWith("s1-")) return "lga";
  if (roundId.startsWith("s2-")) return "senatorial";
  const m = /^s3-(r\d)$/.exec(roundId);
  return m ? (`gf-${m[1]}` as PhaseId) : undefined;
}

// Maximum selections per LGA when a stage is finalized (the document's "3
// per LGA" and the Senatorial "1 per LGA"). The Grand Finale has no
// per-LGA quota.
export const PHASE_QUOTA: Partial<Record<PhaseId, number>> = {
  lga: 3,
  senatorial: 1,
};
