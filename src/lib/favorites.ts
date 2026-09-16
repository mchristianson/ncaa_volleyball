"use client";

import { useSyncExternalStore } from "react";

/**
 * Favorites live entirely in the browser — no account, no server.
 *
 * NCAA box scores identify players only by name + team (there is no stable
 * player id in the public feeds), so a favorited player is keyed on
 * `teamSeo|lastName|firstName`, lowercased.
 */

export type FavoriteKind = "team" | "conference" | "player";

const STORAGE_KEY = "ncaavb.favorites.v1";

type State = Record<FavoriteKind, string[]>;

const EMPTY: State = { team: [], conference: [], player: [] };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      team: parsed.team ?? [],
      conference: parsed.conference ?? [],
      player: parsed.player ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  state = read();
  loaded = true;
  // Keep multiple tabs in sync.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = read();
    listeners.forEach((l) => l());
  });
}

function emit() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota — favorites just won't persist this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): State {
  ensureLoaded();
  return state;
}

export function playerKey(teamSeo: string, first: string, last: string) {
  return `${teamSeo}|${last}|${first}`.toLowerCase();
}

export function parsePlayerKey(key: string) {
  const [teamSeo, last, first] = key.split("|");
  return { teamSeo, last, first };
}

export function toggleFavorite(kind: FavoriteKind, id: string) {
  ensureLoaded();
  const list = state[kind];
  state = {
    ...state,
    [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
  };
  emit();
}

export function clearFavorites() {
  ensureLoaded();
  state = EMPTY;
  emit();
}

export function useFavorites(): State {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function useIsFavorite(kind: FavoriteKind, id: string | null | undefined) {
  const favs = useFavorites();
  return !!id && favs[kind].includes(id);
}

export function useToggleFavorite() {
  return toggleFavorite;
}
