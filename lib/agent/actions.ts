"use client";

import { store } from "@/lib/storage/store";
import { newId } from "@/lib/project";
import type { AspectId, AtmosphereId, Channel, FeedbackAction, ProjectInfo, StepId, Tag } from "@/types";

const now = () => new Date().toISOString();

/** All user intents of the studio, expressed as store updates. */
export const actions = {
  chooseAtmosphere(id: AtmosphereId) {
    store.advance((p) => ({ ...p, answers: { ...p.answers, atmosphere: id } }), 1);
  },
  submitAspects(aspects: AspectId[], note: string) {
    store.advance((p) => ({ ...p, answers: { ...p.answers, aspects, aspectsNote: note.trim() || undefined } }), 2);
  },
  chooseHypothesis(id: string, choice: "a" | "b" | "none") {
    store.advance((p) => ({ ...p, answers: { ...p.answers, hypothesis: { id, choice } } }), 3);
  },
  chooseRefinement(id: string, choice: string) {
    store.advance((p) => ({ ...p, answers: { ...p.answers, refinement: { id, choice } } }), 4);
  },
  correct(tag: Tag) {
    store.update((p) =>
      p.answers.corrections.some((c) => c.tag === tag)
        ? p
        : { ...p, answers: { ...p.answers, corrections: [...p.answers.corrections, { tag, at: now() }] } },
    );
  },
  undoCorrection(tag: Tag) {
    store.update((p) => ({ ...p, answers: { ...p.answers, corrections: p.answers.corrections.filter((c) => c.tag !== tag) } }));
  },
  confirmProfile() {
    store.advance((p) => ({ ...p, answers: { ...p.answers, profileConfirmed: true } }), 5);
  },
  feedback(refId: string, action: FeedbackAction, channel: Channel, step?: StepId) {
    store.update((p) => ({
      ...p,
      answers: { ...p.answers, feedbackLog: [...p.answers.feedbackLog, { refId, action, at: now(), channel, step }] },
    }));
  },
  finishFeedback() {
    store.advance((p) => ({ ...p, answers: { ...p.answers, feedbackDone: true } }), 6);
  },
  removeFromBoard(refId: string) {
    store.update((p) => ({
      ...p,
      answers: { ...p.answers, moodboardRemoved: [...new Set([...p.answers.moodboardRemoved, refId])] },
    }));
  },
  restoreBoard() {
    store.update((p) => ({ ...p, answers: { ...p.answers, moodboardRemoved: [] } }));
  },
  finishMoodboard() {
    store.advance((p) => ({ ...p, answers: { ...p.answers, moodboardDone: true } }), 7);
  },
  saveProject(info: ProjectInfo, finish: boolean) {
    if (finish) store.advance((p) => ({ ...p, answers: { ...p.answers, project: info, projectDone: true } }), 8);
    else store.update((p) => ({ ...p, answers: { ...p.answers, project: info } }));
  },
  sendText(text: string, channel: Channel, step?: StepId) {
    const t = text.trim();
    if (!t) return;
    store.update((p) => ({
      ...p,
      answers: { ...p.answers, texts: [...p.answers.texts, { id: newId(), text: t.slice(0, 400), at: now(), channel, step }] },
    }));
  },
  goTo(step: number) {
    store.goTo(step);
  },
  reset() {
    store.resetActive();
  },
};
