# Supabox — Plano de features antes do lançamento no Google

Atualizado em 12/11/2026. Junta o pedido "Complete Feature Updates & Improvements" com as sugestões de SEO, social e estatísticas.
Regra geral: reaproveitar o que já existe (diário, reviews, listas, seguidores, feed de atividades) e não duplicar nada.

## O que já existe (vai ser reaproveitado)

| Já existe | Onde | Usado em |
|---|---|---|
| Status da biblioteca: Quero jogar / Jogando / Zerado / Abandonado | tabela `user_games` | 1, 8, 12, 14, 15 |
| Diário com datas (início, fim, tipo de jogatina, nota) | tabela `play_sessions`, `GameDiary` na página do jogo | 15, S2 |
| Nota em estrelas (0,5 a 5) + review | tabela `reviews`, `GameReviews` | 1, 12, 14 |
| Seguir pessoas + feed de atividades (adicionou, começou, zerou, review) | `follows`, `activities` | 2 |
| Listas da comunidade (públicas e privadas) | `lists`, `list_items` | 10, 11, 12 |
| 5 jogos favoritos no perfil | `user_favorite_games`, `GamePicker` | 7, 8 |
| Espaço para foto de perfil (ainda sem upload) | coluna `profiles.avatar_path` | 5 |
| Campo de idioma do usuário (`en`, `pt-BR`) | coluna `profiles.locale` | 6 |

## Fase 0 — Urgente

- [x] **0. Erro "Error sending confirmation email" no cadastro** — resolvido em 12/11/2026.
  - Causa: a senha SMTP salva no Supabase não era uma chave válida do Resend, então nenhum e-mail saía.
  - Correção: chave nova "Supabox SMTP 2" (só envio, só supaboxd.com) colada no Supabase; a chave antiga foi apagada.
  - Testado de ponta a ponta: cadastro → e-mail entregue pelo Resend → link confirmou a conta no supaboxd.com. Conta de teste apagada.
- [x] **E-mail privacy@**: encaminhamento pelo ImprovMX testado e entregue no Gmail.

## Fase 1 — Correções

- [ ] **4. Ordem e jogos faltando na home**
  - Diagnóstico: "Novos lançamentos" ordena só por popularidade, que soma número de avaliações e hype. Jogo recém-lançado ainda tem poucas avaliações, então perde para um jogo de meses atrás. Exemplo: Zelda: Ocarina of Time (05/11, popularidade 107) fica abaixo de Marvel's Wolverine (15/09, 342).
  - Correção: nota de destaque que dá peso à data (mais novo sobe) e ao hype de antes do lançamento.
  - Também: revisar os filtros que podem estar escondendo jogos (sem capa, hype mínimo, janela de dias) e a sincronização diária para jogos recém-anunciados.
- [ ] **7. Capas gigantes no celular** na busca de favoritos: tamanho fixo e proporção correta das capas no modal, testado em telas pequenas.

## Fase 2 — Núcleo de jogo e perfil

- [ ] **14. Ao marcar "Zerado", abrir modal de nota + review**
  - Um único modal reaproveitando estrelas e review.
  - Funciona em qualquer lugar onde dá para marcar "Zerado".
- [ ] **8. Favoritos só com jogos zerados e com nota**
  - Modal com busca que mostra apenas jogos da sua biblioteca com status Zerado e nota dada.
  - O banco também passa a recusar favoritos que não cumpram isso.
- [ ] **9. Ordenar e filtrar jogos avaliados** no seu perfil e no de outras pessoas.
  - Ordens: avaliado recentemente, lançamento mais recente, A–Z, maior nota, menor nota, nota da crítica.
  - Filtros: nota, plataforma, gênero.
- [ ] **15. Botão "+" de adicionar rápido**
  - Aparece em dois lugares só: no centro da barra inferior do celular e no topo da Home.
  - Fluxo: buscar o jogo → abre o formulário do Diário existente → "Comecei agora" ou "Estou jogando" → salva no perfil.
- [ ] **5. Foto de perfil**
  - Upload com corte quadrado e redução de tamanho, salvo no Supabase Storage com acesso só do dono.
  - Aparece no perfil, cabeçalho, reviews, feed, listas e seguidores.
  - Hoje o avatar é uma cor; ela continua como fallback.

## Fase 3 — Descoberta e listas

- [ ] **3. "Lançamentos de hoje"** na Home, acima de "Em breve": capa, título e ícones das plataformas.
  - Usa o fuso de Brasília para decidir o que é "hoje".
- [ ] **11. Listas oficiais do Supabox**, com selo "Oficial", separadas das listas da comunidade.
  - **Montadas com dados reais do IGDB** (gênero, plataforma, empresa, tema, nota da crítica, número de avaliações e tempo de jogo):
    - 100 Maiores de Todos os Tempos
    - Melhores por década, por geração de console e de cada ano
    - Nintendo, PlayStation, Xbox, PC
    - Rockstar, Ubisoft, Capcom, FromSoftware, Square Enix, e um sistema que aceita outras empresas
    - RPGs, Terror, Mundo aberto, Indies, Multiplayer, Co-op
    - Joias escondidas (nota alta com poucas avaliações)
    - Menos de 10 horas
    - Mais aguardados
    - Franquias mais icônicas
  - **Precisam de curadoria sua** (não existe dado confiável no IGDB):
    - Melhores trilhas sonoras
    - Mais influentes da história
    - Todo mundo deveria jogar uma vez
    - Melhores com amigos
    - Melhores histórias
    - Soulslike
  - Para essas, eu monto uma primeira versão a partir de critérios públicos (prêmios, listas de crítica), você revisa, e só então publico. Não invento rankings.
- [ ] **12. Navegar pelos jogos de uma lista em carrossel**
  - Clicou num jogo da lista → abre o modo carrossel, deslizando entre os jogos dela.
  - Ações em cada jogo: "Quero jogar" ou "Já joguei". "Já joguei" mostra estrelas e review e tem botão "Adicionar".
  - Vale para listas oficiais e da comunidade.
- [ ] **10. Roleta de jogos** dentro de Listas, com ícone próprio de roleta.
  - Opção A: sorteia da lista "Quero jogar" do perfil que você está vendo.
  - Opção B: sorteia dos clássicos.
  - Animação de giro e link para o jogo sorteado.
- [ ] **1. Boas-vindas + carrossel de clássicos** logo após ativar a conta.
  - Mostra a mensagem "Welcome to Supabox!" e depois o carrossel (o mesmo do item 12).
  - Os clássicos vêm da lista oficial dos maiores de todos os tempos.
  - Aparece uma vez só e pode ser pulado.

## Fase 4 — Social

- [ ] **2. Notificações de atividades de amigos** ("amigos" = pessoas que você segue).
  - Sininho no cabeçalho com contador.
  - Preferências por tipo de atividade: adicionou à coleção, começou a jogar, deu nota ou publicou review.
  - Sininho no perfil de cada pessoa para ligar ou desligar as notificações dela.
  - Geradas no banco a partir do feed de atividades que já existe.
- [ ] **S1. Curtidas e comentários** em reviews e listas, com notificação para o autor.
- [ ] **13. Medalhas**
  - Por reviews escritas e por jogos zerados.
  - Níveis: Bronze 1, Prata 10, Ouro 25, Platina 50, Diamante 100.
  - Calculadas automaticamente e exibidas no perfil.
  - Sem pontos, moedas ou compras.

## Fase 5 — Estatísticas

- [ ] **S2. Diário mais completo:** horas jogadas e plataforma em cada registro, mais uma visão de calendário do diário.
- [ ] **S3. Estatísticas e Retrospectiva do ano**
  - Jogos zerados por mês, gêneros e plataformas favoritas, média das suas notas.
  - Página de retrospectiva compartilhável no fim do ano.

## Fase 6 — Idiomas

- [ ] **6. Português e inglês (i18n)**
  - Todos os textos saem dos componentes para arquivos de tradução, um por idioma, sem duplicar páginas.
  - O idioma vem da escolha do usuário, depois do navegador, e tem seletor no rodapé.
  - Feita depois das outras fases para traduzir tudo de uma vez só.

## Fase 7 — Preparação para o Google (por último)

- [ ] **S4. Sitemap automático:** jogos, perfis públicos, listas públicas e oficiais.
- [ ] **S5. Imagem de compartilhamento:** card gerado para cada jogo, perfil, lista e review (WhatsApp, X, Discord).
- [ ] **S6. Dados estruturados** (schema.org): nota, capa e data aparecendo no resultado do Google.
- [ ] **S7. Página inicial para visitantes:** explica o Supabox para quem não tem conta.
- [ ] **Liberar indexação:** `NEXT_PUBLIC_ALLOW_INDEXING=true` e cadastrar o site no Google Search Console. Só com a sua aprovação.

## Fora do escopo agora

Supapoints, moedas virtuais, medalhas compráveis, reações exclusivas, cartas colecionáveis e pacotes de cartas.

## Como cada fase é entregue

1. Migração do banco testada localmente (PGlite) antes de ir para produção.
2. Testes automáticos e checagem completa (`npm run check`).
3. Teste no navegador em desktop e celular.
4. Commit, deploy na Vercel e teste no site real.
5. Parada para você revisar antes da próxima fase.
