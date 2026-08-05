import { Hand, Sparkles, Swords, Target, Wand2, type LucideIcon } from "lucide-react";

export type VocationGroup = "knight" | "paladin" | "sorcerer" | "druid" | "monk" | "none";

type VocationMeta = {
  group: VocationGroup;
  icon: LucideIcon;
  textClass: string;
  colorClass: string;
};

const KNIGHT: VocationMeta = {
  group: "knight",
  icon: Swords,
  textClass: "text-destructive",
  colorClass: "bg-destructive/10 text-destructive",
};
const PALADIN: VocationMeta = {
  group: "paladin",
  icon: Target,
  textClass: "text-warning",
  colorClass: "bg-warning/10 text-warning",
};
const SORCERER: VocationMeta = {
  group: "sorcerer",
  icon: Wand2,
  textClass: "text-primary",
  colorClass: "bg-primary/10 text-primary",
};
const DRUID: VocationMeta = {
  group: "druid",
  icon: Sparkles,
  textClass: "text-success",
  colorClass: "bg-success/10 text-success",
};
const MONK: VocationMeta = {
  group: "monk",
  icon: Hand,
  textClass: "text-accent",
  colorClass: "bg-accent/10 text-accent",
};
const DEFAULT_META: VocationMeta = {
  group: "none",
  icon: Wand2,
  textClass: "text-muted-foreground",
  colorClass: "bg-muted text-muted-foreground",
};

const VOCATION_META: Record<string, VocationMeta> = {
  Knight: KNIGHT,
  "Elite Knight": KNIGHT,
  Paladin: PALADIN,
  "Royal Paladin": PALADIN,
  Sorcerer: SORCERER,
  "Master Sorcerer": SORCERER,
  Druid: DRUID,
  "Elder Druid": DRUID,
  Monk: MONK,
  "Exalted Monk": MONK,
};

export function getVocationMeta(vocation: string): VocationMeta {
  return VOCATION_META[vocation] ?? DEFAULT_META;
}
