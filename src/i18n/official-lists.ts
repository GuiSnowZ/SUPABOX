import type { Locale } from "./config";

/**
 * Portuguese title/description/criteria for the official lists (the database
 * stores the English text written by scripts/build-official-lists.mts).
 */
const SCORE_PT =
  "Ordenado pela nota do IGDB (crítica e jogadores) ponderada pelo número de avaliações, então um jogo precisa de qualidade e alcance (média bayesiana).";
const REVIEWED_PT = " Jogos marcados errado no IGDB são removidos pela equipe do Supabox.";

const PT: Record<string, { title: string; description: string; criteria: string }> = {
  "100-greatest-games-of-all-time": {
    title: "Os 100 Maiores Jogos de Todos os Tempos",
    description: "Os jogos mais bem avaliados por críticos e jogadores, de todas as épocas e plataformas.",
    criteria: `Todos os jogos com pelo menos 300 avaliações no IGDB. ${SCORE_PT}`,
  },
  "best-games-of-each-decade": {
    title: "Os Melhores Jogos de Cada Década",
    description: "Os dez destaques de cada década, dos fliperamas até hoje.",
    criteria: `Jogos lançados em cada década com pelo menos 40 avaliações; os 10 melhores de cada. ${SCORE_PT}`,
  },
  "most-iconic-video-game-franchises": {
    title: "As Franquias Mais Icônicas dos Games",
    description: "As séries com os catálogos maiores e mais queridos — cada uma representada pelo seu jogo mais bem avaliado.",
    criteria: "Franquias ordenadas pelo total de avaliações no IGDB dos seus jogos (100+ cada); cada uma aparece com o jogo de maior nota.",
  },
  "most-popular-games-of-each-year": {
    title: "Os Jogos Mais Populares de Cada Ano",
    description: "Os cinco jogos mais jogados e avaliados de cada ano desde 1995.",
    criteria: "Para cada ano de lançamento, os cinco jogos com mais avaliações no IGDB (uma medida de quantas pessoas jogaram).",
  },
  "best-games-of-each-console-generation": {
    title: "Os Melhores Jogos de Cada Geração de Consoles",
    description: "Do NES ao PS5: os dez melhores jogos lançados em cada geração.",
    criteria: `Jogos nos consoles de cada geração, lançados durante ela, com pelo menos 30 avaliações; os 10 melhores de cada. ${SCORE_PT}`,
  },
  "best-nintendo-games": {
    title: "Os Melhores Jogos da Nintendo",
    description: "O melhor da Nintendo, dos seus estúdios e jogos publicados.",
    criteria: `Jogos desenvolvidos ou publicados pela Nintendo ou seus estúdios, com pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "best-playstation-games": {
    title: "Os Melhores Jogos de PlayStation",
    description: "O melhor do catálogo próprio da Sony.",
    criteria: `Jogos desenvolvidos ou publicados pela Sony Interactive Entertainment (antiga Sony Computer Entertainment) e seus estúdios, com pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "best-xbox-games": {
    title: "Os Melhores Jogos de Xbox",
    description: "O melhor do catálogo próprio da Microsoft.",
    criteria: `Jogos desenvolvidos ou publicados pelos Xbox Game Studios / Microsoft Studios, com pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "best-pc-games": {
    title: "Os Melhores Jogos de PC",
    description: "Os jogos mais bem avaliados que você pode jogar no PC.",
    criteria: `Jogos disponíveis para PC (Windows) com pelo menos 200 avaliações. ${SCORE_PT}`,
  },
  "best-rockstar-games": {
    title: "Os Melhores Jogos da Rockstar",
    description: "Mundos abertos e épicos criminais dos estúdios da Rockstar.",
    criteria: `Jogos desenvolvidos ou publicados pela Rockstar ou seus estúdios, com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "best-ubisoft-games": {
    title: "Os Melhores Jogos da Ubisoft",
    description: "Assassin's Creed, Rayman, Far Cry e muito mais dos estúdios da Ubisoft.",
    criteria: `Jogos desenvolvidos ou publicados pela Ubisoft ou seus estúdios, com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "best-capcom-games": {
    title: "Os Melhores Jogos da Capcom",
    description: "Resident Evil, Monster Hunter, Street Fighter e o melhor da Capcom.",
    criteria: `Jogos desenvolvidos ou publicados pela Capcom ou seus estúdios, com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "best-fromsoftware-games": {
    title: "Os Melhores Jogos da FromSoftware",
    description: "Souls, Sekiro, Elden Ring e os clássicos mais antigos da FromSoftware.",
    criteria: `Jogos desenvolvidos ou publicados pela FromSoftware, com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "best-square-enix-games": {
    title: "Os Melhores Jogos da Square Enix",
    description: "Final Fantasy, Dragon Quest, Kingdom Hearts — incluindo os anos de Square e Enix.",
    criteria: `Jogos desenvolvidos ou publicados pela Square Enix ou seus estúdios, com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "best-rpgs-of-all-time": {
    title: "Os Melhores RPGs de Todos os Tempos",
    description: "RPGs que valem cem horas da sua vida.",
    criteria: `RPGs no IGDB, sem jogos que são principalmente tiro, hack-and-slash, plataforma, estratégia ou simulação com elementos de RPG. Pelo menos 50 avaliações.${REVIEWED_PT} ${SCORE_PT}`,
  },
  "best-horror-games": {
    title: "Os Melhores Jogos de Terror",
    description: "Jogue com a luz acesa.",
    criteria: `Jogos de terror marcados como "survival horror" ou "terror psicológico" no IGDB — jogos de ação que só têm elementos de terror (hack-and-slash, plataforma, RPGs de ação de fantasia) ficam de fora. Pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "best-open-world-games": {
    title: "Os Melhores Jogos de Mundo Aberto",
    description: "Mundos enormes para você se perder.",
    criteria: `Jogos a partir de 2001 com o tema "Mundo aberto" do IGDB que sejam RPGs/aventuras ou também marcados como "Sandbox"/"open-world" (plataforma e corrida ficam de fora), com pelo menos 60 avaliações.${REVIEWED_PT} ${SCORE_PT}`,
  },
  "best-story-driven-games": {
    title: "Os Melhores Jogos com Foco na História",
    description: "Jogos lembrados pelas histórias e personagens.",
    criteria: `Aventuras, visual novels e RPGs marcados como "story rich", "narrativa" ou "escolhas importam" pela comunidade do IGDB, sem jogos de ação. Pelo menos 40 avaliações. ${SCORE_PT}`,
  },
  "best-indie-games": {
    title: "Os Melhores Jogos Indie",
    description: "Equipes pequenas, jogos enormes.",
    criteria: `Gênero "Indie" no IGDB, com pelo menos 40 avaliações. ${SCORE_PT}`,
  },
  "best-multiplayer-games": {
    title: "Os Melhores Jogos Multiplayer",
    description: "Os melhores jogos para jogar com — ou contra — outras pessoas.",
    criteria: `Jogos feitos para jogar com outras pessoas: modo "Multiplayer" ou "MMO" no IGDB e sem modo single-player. Pelo menos 150 avaliações.${REVIEWED_PT} ${SCORE_PT}`,
  },
  "best-co-op-games": {
    title: "Os Melhores Jogos Cooperativos",
    description: "Juntem-se e terminem juntos.",
    criteria: `Jogos com campanha cooperativa feitos para co-op: marcados como "co-op local" ou sem modo single-player (MMOs ficam de fora). Pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "best-soulslike-games": {
    title: "Os Melhores Soulslike",
    description: "Difíceis, justos e inesquecíveis.",
    criteria: `Jogos marcados como "soulslike" pela comunidade do IGDB (jogos por turnos ficam de fora), com pelo menos 20 avaliações. ${SCORE_PT}`,
  },
  "hidden-gems": {
    title: "Joias Escondidas",
    description: "Jogos brilhantes que passaram despercebidos pela maioria.",
    criteria: "Jogos com nota 80 ou mais tanto da crítica (4+ análises) quanto dos jogadores (10+ avaliações) no IGDB, mas avaliados por menos de 120 pessoas. Lançados há pelo menos um ano; séries esportivas ficam de fora. Ordenados pela nota geral.",
  },
  "games-everyone-should-play-once": {
    title: "Jogos que Todo Mundo Deveria Jogar Uma Vez",
    description: "Experiências essenciais, seja qual for o seu tipo de jogador.",
    criteria: "Curada pela equipe do Supabox.",
  },
  "best-games-under-10-hours": {
    title: "Os Melhores Jogos com Menos de 10 Horas",
    description: "Jogos ótimos para terminar num fim de semana.",
    criteria: `Jogos cujo tempo típico para zerar no IGDB ("normal", enviado pelos jogadores) é menor que 10 horas, com pelo menos 50 avaliações. ${SCORE_PT}`,
  },
  "most-influential-games-in-history": {
    title: "Os Jogos Mais Influentes da História",
    description: "Os jogos que mudaram o que os jogos podiam ser.",
    criteria: "Curada pela equipe do Supabox.",
  },
  "best-games-to-play-with-friends": {
    title: "Os Melhores Jogos para Jogar com Amigos",
    description: "Co-op no sofá, tela dividida e jogos de festa para a noite de jogatina.",
    criteria: `Jogos de festa, luta, corrida, esporte, perguntas, tabuleiro e plataforma com o tema "Festa" do IGDB, tela dividida ou marcados como "co-op local". Pelo menos 30 avaliações.${REVIEWED_PT} ${SCORE_PT}`,
  },
  "best-video-game-soundtracks": {
    title: "As Melhores Trilhas Sonoras dos Games",
    description: "Jogos cuja música fica com você.",
    criteria: `Jogos marcados como "great soundtrack" pela comunidade do IGDB, com pelo menos 30 avaliações. ${SCORE_PT}`,
  },
  "most-anticipated-upcoming-games": {
    title: "Os Jogos Mais Aguardados",
    description: "O que todo mundo está esperando. Atualizada todo dia.",
    criteria: "Jogos ainda não lançados, ordenados pelo hype no IGDB (pessoas acompanhando o jogo). Atualizada diariamente.",
  },
};

/** Section labels inside lists (decades, generations, years) that need translating. */
const SECTIONS_PT: Array<[RegExp, (...m: string[]) => string]> = [
  [/^3rd generation \(NES era\)$/, () => "3ª geração (era NES)"],
  [/^4th generation \(SNES & Genesis\)$/, () => "4ª geração (SNES e Mega Drive)"],
  [/^5th generation \(PlayStation & N64\)$/, () => "5ª geração (PlayStation e N64)"],
  [/^6th generation \(PS2, GameCube, Xbox\)$/, () => "6ª geração (PS2, GameCube, Xbox)"],
  [/^7th generation \(PS3, Xbox 360, Wii\)$/, () => "7ª geração (PS3, Xbox 360, Wii)"],
  [/^8th generation \(PS4, Xbox One, Switch\)$/, () => "8ª geração (PS4, Xbox One, Switch)"],
  [/^9th generation \(PS5, Xbox Series, Switch 2\)$/, () => "9ª geração (PS5, Xbox Series, Switch 2)"],
  [/^(\d{4})s$/, (_, y) => (y.startsWith("19") ? `Anos ${y.slice(2)}` : `Anos ${y}`)],
];

export function officialListText<T extends { slug: string; title: string; description: string; criteria?: string }>(
  list: T,
  locale: Locale,
): { title: string; description: string; criteria: string } {
  const pt = locale === "pt-BR" ? PT[list.slug] : undefined;
  return {
    title: pt?.title ?? list.title,
    description: pt?.description ?? list.description,
    criteria: pt?.criteria ?? list.criteria ?? "",
  };
}

export function officialSection(section: string | null | undefined, locale: Locale): string | null {
  if (!section) return null;
  if (locale !== "pt-BR") return section;
  for (const [re, fn] of SECTIONS_PT) {
    const m = re.exec(section);
    if (m) return fn(...m);
  }
  return section;
}
