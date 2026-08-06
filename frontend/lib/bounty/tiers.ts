export type BountyTier = "beginner" | "adept" | "expert" | "master";

export const BOUNTY_TIERS: { value: BountyTier; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "adept", label: "Adept" },
  { value: "expert", label: "Expert" },
  { value: "master", label: "Master" },
];

export const DEFAULT_BOUNTY_TIER: BountyTier = "beginner";

// Aproximação baseada na comunidade (não é um valor oficial do jogo) — mapeia
// cada tier de bounty para as dificuldades de Bestiary elegíveis. Ajustável
// aqui caso a correspondência oficial seja confirmada no futuro.
export const TIER_DIFFICULTIES: Record<BountyTier, string[]> = {
  beginner: ["easy"],
  adept: ["easy", "medium"],
  expert: ["medium", "hard"],
  master: ["hard", "challenging"],
};

// Quantidade de kills sugerida por tier — não é um valor oficial confirmado
// do Tibia, apenas um ponto de partida editável pelo usuário.
export const TIER_DEFAULT_REQUIRED_KILLS: Record<BountyTier, number> = {
  beginner: 500,
  adept: 1000,
  expert: 2000,
  master: 3000,
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  trivial: "Trivial",
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
  challenging: "Desafiadora",
};
