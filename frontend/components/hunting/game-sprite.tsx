"use client";

import { useState } from "react";
import { Package, Skull } from "lucide-react";

import type { SpriteKind } from "@/lib/hunting/use-sprites";

export function GameSprite({
  kind,
  url,
  alt,
}: {
  kind: SpriteKind;
  url?: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const FallbackIcon = kind === "creature" ? Skull : Package;

  if (!url || failed) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
        <FallbackIcon className="size-3.5" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={24}
      height={24}
      className="size-6 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
