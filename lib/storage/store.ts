"use client";

/**
 * Central client-side store, persisted to localStorage.
 * All routes read the same external store via useSyncExternalStore, so the
 * Studio, the Telegram demo, the brief and the CRM always show the same project
 * (even when Next keeps previously visited routes alive in the background).
 */
import { useSyncExternalStore } from "react";
import { emptyAnswers } from "@/lib/agent/engine";
import { createProject, withSnapshot } from "@/lib/project";
import type { CrmStatus, Project } from "@/types";

const KEY_PROJECTS = "forme:v1:projects";
const KEY_ACTIVE = "forme:v1:active";
const KEY_CRM = "forme:v1:crm";
export const SCHEMA_VERSION = 1 as const;

export interface CrmMeta {
  status: Record<string, CrmStatus>;
  notes: Record<string, string>;
}

export interface StoreState {
  hydrated: boolean;
  projects: Record<string, Project>;
  activeId: string | null;
  crm: CrmMeta;
  error: string | null;
}

const SERVER_STATE: StoreState = {
  hydrated: false,
  projects: {},
  activeId: null,
  crm: { status: {}, notes: {} },
  error: null,
};

let state: StoreState = SERVER_STATE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function safeRead<T>(key: string): { value: T | null; error?: string } {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { value: null };
    return { value: JSON.parse(raw) as T };
  } catch {
    return { value: null, error: "No se pudieron leer los datos guardados en este navegador. Se ha empezado de cero." };
  }
}

function safeWrite(key: string, value: unknown): string | null {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    return null;
  } catch {
    return "No se pudo guardar el progreso en este navegador (almacenamiento lleno o bloqueado). Puedes seguir, pero los cambios se perderán al recargar.";
  }
}

/** Accepts only projects written with a schema we understand. */
function migrate(raw: unknown): Record<string, Project> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Project> = {};
  for (const [id, p] of Object.entries(raw as Record<string, Partial<Project>>)) {
    if (p && p.schemaVersion === SCHEMA_VERSION && p.answers && p.conversationId) {
      out[id] = {
        ...(p as Project),
        answers: { ...emptyAnswers(), ...p.answers, project: { ...p.answers.project, functional: p.answers.project?.functional ?? [] } },
        telegram: p.telegram ?? [],
      };
    }
  }
  return out;
}

function load(): StoreState {
  const errors: string[] = [];
  const p = safeRead<unknown>(KEY_PROJECTS);
  const a = safeRead<string>(KEY_ACTIVE);
  const c = safeRead<CrmMeta>(KEY_CRM);
  [p.error, a.error, c.error].forEach((e) => e && errors.push(e));
  const projects = migrate(p.value);
  const activeId = a.value && projects[a.value] ? a.value : null;
  return {
    hydrated: true,
    projects,
    activeId,
    crm: { status: c.value?.status ?? {}, notes: c.value?.notes ?? {} },
    error: errors[0] ?? null,
  };
}

function ensureHydrated() {
  if (!state.hydrated && typeof window !== "undefined") {
    state = load();
  }
}

function subscribe(cb: () => void) {
  ensureHydrated();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key.startsWith("forme:")) {
      state = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureHydrated();
  return state;
}

function getServerSnapshot() {
  return SERVER_STATE;
}

function commit(next: Partial<StoreState>, persist: ("projects" | "active" | "crm")[]) {
  state = { ...state, ...next };
  let error: string | null = null;
  for (const k of persist) {
    if (k === "projects") error = safeWrite(KEY_PROJECTS, state.projects) ?? error;
    if (k === "active") error = safeWrite(KEY_ACTIVE, state.activeId) ?? error;
    if (k === "crm") error = safeWrite(KEY_CRM, state.crm) ?? error;
  }
  if (error) state = { ...state, error };
  emit();
}

// ————————————————————————————————————————— helpers


// ————————————————————————————————————————— actions

export const store = {
  /** Apply a change to the active project (creating one if needed). */
  update(fn: (p: Project) => Project) {
    ensureHydrated();
    const current = state.activeId ? state.projects[state.activeId] : undefined;
    const base = current ?? createProject();
    const next = withSnapshot({ ...fn(base), updatedAt: new Date().toISOString() });
    commit(
      { projects: { ...state.projects, [next.conversationId]: next }, activeId: next.conversationId },
      ["projects", "active"],
    );
    return next;
  },
  /** Go to a step the user has already reached. */
  goTo(step: number) {
    store.update((p) => ({ ...p, currentStep: Math.max(0, Math.min(step, p.maxStep)) }));
  },
  /** Move forward and unlock the next step. */
  advance(fn: (p: Project) => Project, to: number) {
    store.update((p) => {
      const n = fn(p);
      return { ...n, currentStep: to, maxStep: Math.max(n.maxStep, to) };
    });
  },
  openProject(id: string) {
    ensureHydrated();
    if (!state.projects[id]) return;
    commit({ activeId: id }, ["active"]);
  },
  resetActive() {
    ensureHydrated();
    if (!state.activeId) return;
    const projects = { ...state.projects };
    delete projects[state.activeId];
    commit({ projects, activeId: null }, ["projects", "active"]);
  },
  setStatus(id: string, status: CrmStatus) {
    ensureHydrated();
    commit({ crm: { ...state.crm, status: { ...state.crm.status, [id]: status } } }, ["crm"]);
  },
  setNote(id: string, note: string) {
    ensureHydrated();
    commit({ crm: { ...state.crm, notes: { ...state.crm.notes, [id]: note } } }, ["crm"]);
  },
  dismissError() {
    state = { ...state, error: null };
    emit();
  },
};

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useActiveProject(): { hydrated: boolean; project: Project | null } {
  const s = useStore();
  return { hydrated: s.hydrated, project: s.activeId ? s.projects[s.activeId] ?? null : null };
}
