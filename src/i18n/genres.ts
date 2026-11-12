import type { Locale } from "./config";

/** Portuguese names for the genre/theme tags stored on games (see lib/igdb/map.ts). */
const GENRES_PT: Record<string, string> = {
  RPG: "RPG",
  "Hack and Slash": "Hack and Slash",
  "Turn-based Strategy": "Estratégia por turnos",
  "Real-time Strategy": "Estratégia em tempo real",
  Platformer: "Plataforma",
  Simulation: "Simulação",
  "Point-and-click": "Point-and-click",
  "Card & Board": "Cartas e tabuleiro",
  Trivia: "Perguntas e respostas",
  MOBA: "MOBA",
  Fighting: "Luta",
  Shooter: "Tiro",
  Music: "Música",
  Puzzle: "Quebra-cabeça",
  Racing: "Corrida",
  Sport: "Esporte",
  Strategy: "Estratégia",
  Tactical: "Tático",
  Pinball: "Pinball",
  Adventure: "Aventura",
  Indie: "Indie",
  Arcade: "Arcade",
  "Visual Novel": "Visual novel",
  Horror: "Terror",
  Survival: "Sobrevivência",
  "Open World": "Mundo aberto",
  "Sci-Fi": "Ficção científica",
  Fantasy: "Fantasia",
  Sandbox: "Sandbox",
  Stealth: "Furtividade",
  Mystery: "Mistério",
};

export function genreName(genre: string, locale: Locale): string {
  return locale === "pt-BR" ? (GENRES_PT[genre] ?? genre) : genre;
}
