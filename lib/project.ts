import { computeProfile, emptyAnswers } from "@/lib/agent/engine";
import { buildMoodboard, buildTranscript, projectTitle, pruneAnswers, reachableStep } from "@/lib/agent/scenario";
import { buildBrief } from "@/lib/brief/build";
import type { Project } from "@/types";

export const SCHEMA = 1 as const;

export function newId() {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 46656).toString(36).padStart(3, "0");
  return `fr-${t}-${r}`;
}

/** Normalises a project and refreshes its derived snapshot (profile, moodboard, transcript, brief). */
export function withSnapshot(p: Project): Project {
  const answers = pruneAnswers(p.answers);
  const maxStep = reachableStep(answers, p.maxStep);
  const currentStep = Math.min(p.currentStep, maxStep);
  const briefReady = maxStep >= 8;
  const briefCreatedAt = briefReady ? p.briefCreatedAt ?? new Date().toISOString() : p.briefCreatedAt;
  const base: Project = { ...p, answers, maxStep, currentStep, briefCreatedAt };
  return {
    ...base,
    name: projectTitle(answers),
    snapshot: {
      messages: buildTranscript(answers, Math.max(currentStep, maxStep)),
      tasteProfile: computeProfile(answers),
      moodboard: buildMoodboard(answers),
      brief: briefReady ? buildBrief(answers, briefCreatedAt!) : null,
    },
  };
}

export function createProject(): Project {
  const now = new Date().toISOString();
  return withSnapshot({
    schemaVersion: SCHEMA,
    conversationId: newId(),
    name: "Proyecto nuevo",
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
    maxStep: 0,
    answers: emptyAnswers(),
    telegram: [],
  });
}

