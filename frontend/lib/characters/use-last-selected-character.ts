"use client";

import { useState } from "react";

const STORAGE_KEY = "tibiastatistics:last-character-id";

function readStoredCharacterId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function useLastSelectedCharacterId() {
  const [lastCharacterId, setLastCharacterIdState] = useState<string | null>(
    readStoredCharacterId,
  );

  function setLastCharacterId(id: string) {
    setLastCharacterIdState(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }

  return { lastCharacterId, setLastCharacterId };
}
