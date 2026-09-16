"use client";

import { useSyncExternalStore } from "react";

type VideoCompletionButtonProps = {
  storageKey: string;
  videoId: string;
};

const COMPLETION_EVENT = "zero-to-app:video-completion-changed";

function readCompletedVideos(storageKey: string): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    return new Set(
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function VideoCompletionButton({
  storageKey,
  videoId,
}: VideoCompletionButtonProps) {
  const completed = useSyncExternalStore(
    (onStoreChange) => {
      function handleStorage(event: StorageEvent) {
        if (event.key === storageKey) onStoreChange();
      }

      window.addEventListener("storage", handleStorage);
      window.addEventListener(COMPLETION_EVENT, onStoreChange);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(COMPLETION_EVENT, onStoreChange);
      };
    },
    () => readCompletedVideos(storageKey).has(videoId),
    () => false,
  );

  function toggleCompleted() {
    const completedVideos = readCompletedVideos(storageKey);
    const nextCompleted = !completedVideos.has(videoId);

    if (nextCompleted) completedVideos.add(videoId);
    else completedVideos.delete(videoId);

    try {
      localStorage.setItem(storageKey, JSON.stringify([...completedVideos]));
    } catch {
      return;
    }

    window.dispatchEvent(new Event(COMPLETION_EVENT));
  }

  return (
    <button
      type="button"
      aria-pressed={completed}
      onClick={toggleCompleted}
      className={
        completed
          ? "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--lime)] px-5 text-sm font-black text-[var(--ink)] transition hover:brightness-95"
          : "inline-flex min-h-11 items-center justify-center rounded-full border border-zinc-600 px-5 text-sm font-black text-zinc-200 transition hover:border-[var(--lime)] hover:text-[var(--lime)]"
      }
    >
      {completed ? "הושלם ✓" : "סימון כהושלם"}
    </button>
  );
}
